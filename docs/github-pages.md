# GitHub Pages deployment

**Live application:** <https://interfacethegreatest.github.io/first-light/>

**Repository:** <https://github.com/interfacethegreatest/first-light>

GitHub Pages is enabled with GitHub Actions as its source. The [initial deployment workflow](https://github.com/interfacethegreatest/first-light/actions/runs/42617690422) passed the checks, build, and deployment. Publication was explicitly requested by the user. The setup instructions below also apply when moving to another repository.

## One-time GitHub setup

1. Create an empty public repository named `first-light` in the intended account. Do not initialize it with another README or commit.
2. Grant the connected GitHub integration access to that repository, including content and Actions access needed to push the workflow and run it.
3. In the repository's **Settings → Pages**, choose **GitHub Actions** as the build and deployment source. Repository administration access is required for this setting.

No token or password should be placed in the repository or supplied in chat. The workflow uses GitHub's short-lived job tokens.

## Publish an approved revision

After the repository exists and access is available, add its HTTPS Git URL as `origin` and push `main`. Then manually run **Publish GitHub Pages** from the repository's Actions tab, or use:

```sh
gh workflow run pages.yml --repo interfacethegreatest/first-light --ref main
```

The workflow installs from the lockfile, runs type checks, tests, and a production build, then uploads and deploys `dist/`. It uses Node.js 24. The build sets `VITE_BASE_PATH` to `/<repository-name>/` so JavaScript, CSS, and favicon URLs resolve at the Pages project path. Future deployments require manually dispatching this workflow.

## Verify the production path locally

```sh
VITE_BASE_PATH=/first-light/ npm run check
VITE_BASE_PATH=/first-light/ npm run preview
```

Open the preview URL beneath `/first-light/`. Confirm the scripts, stylesheet, and favicon load. Repeat the source → decision → status → reload → JSON export workflow and check a narrow viewport. See [the original verification steps](verification.md).

After remote deployment, confirm the workflow succeeded and use the Pages URL reported by GitHub, rather than assuming a URL is already live. Check the page and its assets over HTTPS and repeat the core browser flow before returning the link.

## Data behavior

Publishing the application does not upload browser research records. A visitor starts with an empty workspace on the new origin. Other project sites under the same `owner.github.io` origin share the browser-storage boundary. The app remains browser-local with export and no import interface; it is not a shared research database.
