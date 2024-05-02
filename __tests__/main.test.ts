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
  process.env['INPUT_MAYHEM-TOKEN'] = process.env.MAYHEM_TOKEN
  process.env['INPUT_MAYHEM-URL'] = 'https://app.mayhem.security'
  process.env['INPUT_GITHUB-TOKEN'] = process.env.GITHUB_TOKEN
  process.env['INPUT_DURATION'] = '10'
  process.env['INPUT_ZAP-API-SCAN'] = 'true'
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
      expect.stringContaining('The Mayhem for API scan found issues in the API')
    )
  }
}

test('test MAYHEM_TOKEN authentication', () => {
  if (process.env.MAYHEM_TOKEN) {
    mapi_api_run({
      'INPUT_MAYHEM-TOKEN': process.env.MAYHEM_TOKEN,
      'INPUT_GITHUB-TOKEN': 'invalid github token'
    })
  } else {
    throw new Error(
      'Environment variable MAYHEM_TOKEN required when running these tests.'
    )
  }
})

test('test github tokenless authentication', () => {
  if (process.env.GITHUB_TOKEN) {
    mapi_api_run({
      'INPUT_MAYHEM-TOKEN': 'invalid Mayhem token',
      'INPUT_GITHUB-TOKEN': process.env.GITHUB_TOKEN
    })
  } else {
    throw new Error(
      'Environment variable GITHUB_TOKEN required when running these tests.'
    )
  }
})
