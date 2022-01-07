import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import * as exec from '@actions/exec'
import {chmodSync} from 'fs'
import slugify from 'slugify'

import {cliInfo} from './mapiAPI'

// Return local path to donwloaded or cached CLI
async function mapiCLI(): Promise<string> {
  // Get latest version from API
  let cliVersion = 'latest'
  try {
    cliVersion = (await cliInfo()).latest_version
  } catch (err) {
    core.info(err.message)
    core.debug('Could not get CLI version. Using latest')
  }

  // Infer right version from environment
  let os = ''
  let bin = 'mapi'
  if (process.platform === 'win32') {
    os = 'windows-amd64'
    bin = 'mapi.exe'
  } else if (process.platform === 'darwin') {
    os = 'macos'
  } else {
    os = 'linux-musl'
  }

  // Return cache if available
  const cachedPath = tc.find('mapi', cliVersion, os)
  if (cachedPath) {
    core.debug(`found cache: ${cachedPath}`)
    return `${cachedPath}/${bin}`
  }

  // Download the CLI and cache it if version is set
  const mapiPath = await tc.downloadTool(
    `https://mayhem4api.forallsecure.com/downloads/cli/${cliVersion}/${os}/${bin}`
  )
  chmodSync(mapiPath, 0o755)
  if (cliVersion === 'latest') {
    return mapiPath
  }

  const folder = await tc.cacheFile(mapiPath, bin, 'mapi', cliVersion, os)
  return `${folder}/${bin}`
}

async function run(): Promise<void> {
  try {
    // Disable auto udpates since we always get the latest CLI
    process.env['SKIP_MAPI_AUTO_UPDATE'] = 'true'
    const cli = await mapiCLI()

    // Load inputs
    const mapiToken: string = core.getInput('mapi-token', {required: true})
    const apiUrl: string = core.getInput('api-url', {required: true})
    const apiSpec: string = core.getInput('api-spec', {required: true})
    const duration: string = core.getInput('duration', {required: true})
    const sarifReport: string | undefined = core.getInput('sarif-report')
    const htmlReport: string | undefined = core.getInput('html-report')

    // Auto-generate target name
    const repo = process.env['GITHUB_REPOSITORY']
    if (repo === undefined) {
      throw Error(
        'Missing GITHUB_REPOSITORY environment variable. Are you not running this in a Github Action environement?'
      )
    }
    const apiName = slugify(repo.replace('/', '-'), {lower: true})

    // Generate mapi run args based on inputs
    const args = ['run', apiName, duration, apiSpec, '--url', apiUrl]
    if (sarifReport) {
      args.push('--sarif', sarifReport)
    }
    if (htmlReport) {
      args.push('--html', htmlReport)
    }
    core.debug(args.join(' '))

    process.env['MAPI_TOKEN'] = mapiToken

    // We expect the token to be a service account which can only belong to a
    // single organization, therefore we do not need to specify the org
    // explicitly in the target argument.

    // Start fuzzing
    const res = await exec.exec(cli, args, {ignoreReturnCode: true})
    if (res !== 0) {
      // TODO: should we print issues here?
      throw new Error('The Mayhem for API scan found issues in the API')
    }
  } catch (error) {
    core.info(`mapi action failed with: ${error.message}`)
    core.setFailed(error.message)
  }
}

run()
