import axios from 'axios'

const client = axios.create({
  xsrfCookieName: 'mapi_csrf',
  xsrfHeaderName: 'x-csrf-token',
  baseURL: 'https://app.mayhem.security/',
  headers: {
    'user-agent': `mapi-github-action/${process.env.npm_package_version}`
  }
})

interface CLIInfo {
  version: string
}

export async function cliInfo(os: string, bin: string): Promise<CLIInfo> {
  const resp = await client.get(`/cli/mapi/${os}/latest/${bin}.meta.json`)
  return resp.data
}
