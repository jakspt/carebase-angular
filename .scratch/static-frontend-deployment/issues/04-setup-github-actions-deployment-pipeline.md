# Setup GitHub Actions Deployment Pipeline for GitHub Pages

Status: ready-for-agent

## Context

Static deployment to GitHub Pages must be automated upon pushes to the main branch using GitHub's official OpenID Connect deployment actions (`actions/deploy-pages@v4`).

## Requirements

1. **Create Workflow File**:
   - Create `.github/workflows/deploy-pages.yml`.
   - Configure permissions:
     ```yaml
     permissions:
       contents: read
       pages: write
       id-token: write
     ```
   - Configure triggers:
     - Push to `main` with paths:
       - `frontend/carebase-frontend/**`
       - `.github/workflows/deploy-pages.yml`
     - `workflow_dispatch`
   - Setup build and deploy jobs:
     - Use `actions/checkout@v4`.
     - Use `actions/setup-node@v4` with Node 22 and npm caching.
     - Use `actions/configure-pages@v5`.
     - Run `npm ci` in `frontend/carebase-frontend`.
     - Run `npx ng build --configuration=static --base-href="${{ steps.pages.outputs.base_path }}/"`.
     - Use `actions/upload-pages-artifact@v3` with path `frontend/carebase-frontend/dist/carebase-frontend/browser`.
     - Use `actions/deploy-pages@v4` in the deployment job.

## Verification

- `.github/workflows/deploy-pages.yml` conforms to valid GitHub Actions workflow schema.
- Concurrency group `pages` prevents race conditions on subsequent pushes.
- Path filters ensure non-frontend commits do not trigger unwanted builds.
