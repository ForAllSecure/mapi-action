# Mayhem for API GitHub Action

[![Mayhem for API](https://mayhem4api.forallsecure.com/downloads/img/mapi-logo-full-color.svg)](http://mayhem4api.forallsecure.com/signup)

A GitHub Action for using Mayhem for API to check for reliability,
performance and security issues in your APIs. 

## About Mayhem for API

🧪 Modern App Testing: Mayhem for API is a dynamic testing tool that
catches reliability, performance and security bugs before they hit
production.

🧑‍💻 For Developers, by developers: The engineers building
software are the best equipped to fix bugs, including security bugs. As
engineers ourselves, we're building tools that we wish existed to make
our job easier! 

🤖 Simple to Automate in CI: Tests belong in CI, running on every commit
and PRs. We make it easy, and provide results right in your PRs where
you want them. Adding Mayhem for API to a DevOps pipeline is easy.

Want to try it? Start a [30-day free
trial](http://mayhem4api.forallsecure.com/signup).

## Usage

Use the Action as follows:

```yaml
name: Example workflow for Mayhem for API
on: push
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: Start your API
      run: ./run_your_api.sh & # <- update this

    - name: Run Mayhem for API to check for vulnerabilities
      uses: ForAllSecure/mapi-action@master
      with:
        mapi-token: ${{ secrets.MAPI_TOKEN }}
        api-url: http://localhost:8000 # <- update this
        api-spec: your-openapi-spec-or-postman-collection.json # <- update this
```

This repo contains a [full example](workflow.yml) for reference.

The action accepts the follow inputs:

| Required | Input Name | Type | Description | Default
| --- | --- | --- | --- | ---
| ✔️ | `mapi-token` | string | Mayhem for API service account token | 
| ✔️ | `api-url` | string | URL to your running API. *Example:* http://localhost:8000/api/v1 | 
| ✔️ | `api-spec` | string | Path or URL to your Swagger spec, OpenAPI spec, or Postman collection.| 
|   | `duration` | number | Duration of scan, in seconds | 60 
|   | `html-report` | string | Path to the generated SARIF report | 
|   | `sarif-report` | string | Path to the generated HTML report | 


### Getting your Mayhem for API token

The Actions example above refer to a Mayhem for API token:

```yaml
with:
  mapi-token: ${{ secrets.MAPI_TOKEN }}
```

You can create a [service account
token](https://mayhem4api.forallsecure.com/docs/ch01-03-organizations.html#service-accounts)
using the Mayhem for API CLI:

```
mapi organization service-account create <your-org> <service-account-name>
```

This will output a token that you can then add as a secret to your
GitHub repository or organization.

### Continuing on error

The above examples will fail the workflow when issues are found. If you
want to ensure the Action continues, even if Mayhem for API found
issues, then continue-on-error can be used.

```yaml
name: Example workflow for Mayhem for API
on: push
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: Start your API
      run: ./run_your_api.sh & # <- update this

    - name: Run Mayhem for API to check for vulnerabilities
      uses: ForAllSecure/mapi-action@master
      continue-on-error: true
      with:
        mapi-token: ${{ secrets.MAPI_TOKEN }}
        api-url: http://localhost:8000 # <- update this
        api-spec: your-openapi-spec-or-postman-collection.json # <- update this
```

# Reports

Mayhem for API generate reports when you pass `sarif-report` or
`html-report` to the input. Make sure to pass `continue-on-error` to the
Mayhem for API step if you want to process the reports in follow-up
steps.

## Artifact HTML Report

![HTML Report](https://mayhem4api.forallsecure.com/downloads/img/sample-report.png)

To artifact the report in your build, add this step to your pipeline:

```yaml
- name: Run Mayhem for API to check for vulnerabilities
  uses: ForAllSecure/mapi-action@master
  continue-on-error: true
  with:
    mapi-token: ${{ secrets.MAPI_TOKEN }}
    api-url: http://localhost:8000 # <- update this
    api-spec: your-openapi-spec-or-postman-collection.json # <- update this
    html-report: mapi.html

# Archive HTML report
- name: Archive Mayhem for API report
  uses: actions/upload-artifact@v2
  with:
    name: mapi-report
    path: mapi.html
```

## GitHub Code Scanning support

![Mayhem for API issue in your
PR](http://mayhem4api.forallsecure.com/downloads/img/sarif-github.png)

Uploading SARIF reports to GitHub allows you to see any issue found by
Mayhem for API right on your PR, as well as in the "Security" tab of
your repository. This currently requires you to have a GitHub Enterprise
Plan or have a public repository. To upload the SARIF report, add this
step to your pipeline:

```yaml
- name: Run Mayhem for API to check for vulnerabilities
  uses: ForAllSecure/mapi-action@master
  continue-on-error: true
  with:
    mapi-token: ${{ secrets.MAPI_TOKEN }}
    api-url: http://localhost:8000 # <- update this
    api-spec: your-openapi-spec-or-postman-collection.json # <- update this
    sarif-report: mapi.sarif

# Upload SARIF file (only available on public repos or github enterprise)
- name: Upload SARIF file
  uses: github/codeql-action/upload-sarif@v1
  with:
    sarif_file: mapi.sarif
```

If your API server sends back stacktraces in the 500 Internal Server
Error (only do this in a test environment -- never in production!),
Mayhem for API will try to map issues it finds to the exact line of code
that triggered the issue.
