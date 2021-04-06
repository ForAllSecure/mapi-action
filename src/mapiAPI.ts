import axios from 'axios'

const client = axios.create({
  xsrfCookieName: 'mapi_csrf',
  xsrfHeaderName: 'x-csrf-token',
  baseURL: 'https://mayhem4api.forallsecure.com/',
  headers: {
    'user-agent': `mapi-github-action/${process.env.npm_package_version}`
  }
})

interface CLIInfo {
  latest_version: string
}

export async function cliInfo(): Promise<CLIInfo> {
  const resp = await client.get('/api/v1/hello/cli')
  return resp.data
}
