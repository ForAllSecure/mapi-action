import axios from 'axios'

interface CLIInfo {
  version: string
}

export async function cliInfo(
  os: string,
  bin: string,
  baseURL: string
): Promise<CLIInfo> {
  const client = axios.create({
    xsrfCookieName: 'mapi_csrf',
    xsrfHeaderName: 'x-csrf-token',
    baseURL: `${baseURL}`,
    headers: {
      'user-agent': `mapi-github-action/${process.env.npm_package_version}`
    }
  })
  const resp = await client.get(`/cli/mapi/${os}/latest/${bin}.meta.json`)
  return resp.data
}
