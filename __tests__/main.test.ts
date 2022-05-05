import * as process from 'process'
import {ExecFileSyncOptions, execFileSync} from 'child_process'
import * as path from 'path'

const mapi_api_run = (additional_env: {[key: string]: string}) => {
  for (let k in additional_env) {
    process.env[k] = additional_env[k]
  }
  process.env['GITHUB_REPOSITORY'] = 'ForAllSecure/mapi-action'
  process.env['RUNNER_TEMP'] = '/tmp'
  process.env['RUNNER_TOOL_CACHE'] = '/tmp'
  process.env['INPUT_MAPI-TOKEN'] = process.env.MAPI_TOKEN
  process.env['INPUT_GITHUB-TOKEN'] = process.env.GITHUB_TOKEN
  process.env['INPUT_DURATION'] = '10'
  process.env['INPUT_API-URL'] =
    'https://demo-api.mayhem4api.forallsecure.com/api/v3'
  process.env['INPUT_API-SPEC'] =
    'https://demo-api.mayhem4api.forallsecure.com/api/v3/openapi.json'
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: ExecFileSyncOptions = {
    env: process.env
  }
  try {
    execFileSync(np, [ip], options)
    throw new Error('Actions should have failed due to finding a bug')
  } catch (error: any) {
    if (error.stdout === undefined) {
      throw error
    }
    expect(error.stdout.toString()).toEqual(
      expect.stringContaining('Fuzzing complete!,')
    )
    expect(error.stdout.toString()).toEqual(
      expect.stringContaining('Found internal-server-error!')
    )
    expect(error.stdout.toString()).toEqual(
      expect.stringContaining('The Mayhem for API scan found issues in the API')
    )
  }
}

test('test MAPI_TOKEN authentication', () => {
  if (process.env.MAPI_TOKEN) {
    mapi_api_run({
      'INPUT_MAPI-TOKEN': process.env.MAPI_TOKEN,
      'INPUT_GITHUB-TOKEN': 'invalid github token'
    })
  } else {
    throw new Error(
      'Environment variable MAPI_TOKEN required when running these tests.'
    )
  }
})

test('test github tokenless authentication', () => {
  if (process.env.GITHUB_TOKEN) {
    mapi_api_run({
      'INPUT_MAPI-TOKEN': 'invalid mapi token',
      'INPUT_GITHUB-TOKEN': process.env.GITHUB_TOKEN
    })
  } else {
    throw new Error(
      'Environment variable GITHUB_TOKEN required when running these tests.'
    )
  }
})
