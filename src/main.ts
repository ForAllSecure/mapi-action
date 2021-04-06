import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import * as exec from '@actions/exec'
import {chmod} from 'fs/promises'
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
  await chmod(mapiPath, 0o755)
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
    const repo = process.env['GITHUB_REPOSITORY']
    if (repo === undefined) {
      throw Error(
        'Missing GITHUB_REPOSITORY environment variable. Are you not running this in a Github Action environement?'
      )
    }

    const cli = await mapiCLI()
    const apiUrl: string = core.getInput('api-url')
    const apiSpec: string = core.getInput('api-spec-path')
    const duration: string = core.getInput('duration')
    const sarifReport: string | undefined = core.getInput('sarif-report')
    const htmlReport: string | undefined = core.getInput('html-report')
    const apiName = slugify(repo.replace('/', '-'), {lower: true})

    // We expect the token to be a service account which can only belong to a
    // single organization, therefore we do not need to specify the org
    // explicitely here
    await exec.exec(cli, ['target', 'create', apiName, apiUrl])

    const args = ['run', apiName, duration, apiSpec, '--url', apiUrl]
    if (sarifReport) {
      args.push('--sarif', sarifReport)
    }
    if (htmlReport) {
      args.push('--html', htmlReport)
    }
    core.debug(args.join(' '))

    await exec.exec(cli, args)
    core.info('done')

    //core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    core.info(`mapi action failed with: ${error.message}`)
    core.setFailed(error.message)
  }
}

run()
