import * as process from 'process'
import {ExecFileSyncOptions, execFileSync} from 'child_process'
import * as path from 'path'

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  process.env['INPUT_MAPI_TOKEN'] = process.env.MAPI_TOKEN
  process.env['INPUT_API_URL'] =
    'https://demo-api.mayhem4api.forallsecure.com/api/v3'
  process.env['INPUT_API_SPEC'] =
    'https://demo-api.mayhem4api.forallsecure.com/api/v3/openapi.json'
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: ExecFileSyncOptions = {
    env: process.env
  }
  console.log(execFileSync(np, [ip], options).toString())
})
