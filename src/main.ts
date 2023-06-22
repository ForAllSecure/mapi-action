import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import * as tc from '@actions/tool-cache'
import {chmodSync} from 'fs'
import {cliInfo} from './mapiapi'
import slugify from 'slugify'

// Return local path to donwloaded or cached CLI
async function mapiCLI(): Promise<string> {
  // Get latest version from API
  let cliVersion = 'latest'

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
    `https://app.mayhem.security/cli/mapi/${os}/${cliVersion}/${bin}`
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
    const mapiToken: string = core.getInput('mapi-token')
    const mapiUrl: string = core.getInput('mapi-url')
    const mayhemToken: string = core.getInput('mayhem-token')
    const mayhemUrl: string = core.getInput('mayhem-url')
    const githubToken: string = core.getInput('github-token', {required: true})
    const apiUrl: string = core.getInput('api-url', {required: true})
    const apiSpec: string = core.getInput('api-spec', {required: true})
    const duration: string = core.getInput('duration', {required: true})
    const target: string | undefined = core.getInput('target')
    const zapApiScan: boolean | undefined = core.getBooleanInput('zap-api-scan')
    const sarifReport: string | undefined = core.getInput('sarif-report')
    const htmlReport: string | undefined = core.getInput('html-report')
    const postmanApiKey: string | undefined = core.getInput('postman-api-key')
    const postmanEnvironment: string | undefined = core.getInput(
      'postman-environment'
    )
    const experimentalRewritePlugin: string | undefined = core.getInput(
      'experimental-rewrite-plugin'
    )
    const experimentalClassifyPlugin: string | undefined = core.getInput(
      'experimental-classify-plugin'
    )
    const runArgs: string[] = core.getMultilineInput('run-args')

    const issue_number = github.context.issue.number
    if (issue_number) {
      process.env['GITHUB_ISSUE_ID'] = String(issue_number)
    }

    // Auto-generate target name
    const repo = process.env['GITHUB_REPOSITORY']
    if (repo === undefined) {
      throw Error(
        'Missing GITHUB_REPOSITORY environment variable. Are you not running this in a Github Action environment?'
      )
    }
    const apiName =
      target === '' || target === undefined || target === null
        ? slugify(repo.replace('/', '-'), {lower: true})
        : target

    // Generate mapi run args based on inputs
    const args = ['run', apiName, duration, apiSpec, '--url', apiUrl]
    if (sarifReport) {
      args.push('--sarif', sarifReport)
    }
    if (htmlReport) {
      args.push('--html', htmlReport)
    }
    if (postmanApiKey) {
      args.push('--postman-api-key', postmanApiKey)
    }
    if (postmanEnvironment) {
      args.push('--postman-environment', postmanEnvironment)
    }
    if (experimentalRewritePlugin) {
      args.push('--experimental-rewrite-plugin', experimentalRewritePlugin)
    }
    if (experimentalClassifyPlugin) {
      args.push('--experimental-classify-plugin', experimentalClassifyPlugin)
    }
    if (zapApiScan) {
      args.push('--zap')
    }
    args.push(...runArgs)

    core.debug(args.join(' '))

    if (mayhemToken || mapiToken) {
      process.env['MAYHEM_TOKEN'] = mayhemToken || mapiToken
    }
    if (mayhemUrl || mapiUrl) {
      process.env['MAYHEM_URL'] = mayhemUrl || mapiUrl
    }
    process.env['GITHUB_TOKEN'] = githubToken

    // We expect the token to be a service account which can only belong to a
    // single organization, therefore we do not need to specify the org
    // explicitly in the target argument.

    // Start fuzzing
    const res = await exec.exec(cli, args, {ignoreReturnCode: true})
    if (res !== 0) {
      // TODO: should we print issues here?
      throw new Error('The Mayhem for API scan found issues in the API')
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      core.info(`mapi action failed with: ${err.message}`)
      core.setFailed(err.message)
    }
  }
}

run()
