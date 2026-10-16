# Configure Static Build and Hash Routing

Status: ready-for-agent

## Context

To run standalone on GitHub Pages without an active Flask API backend, the frontend requires compile-time adapter substitution via Angular `fileReplacements` and client-side hash routing (`withHashLocation()`) to eliminate HTTP 404 errors on direct navigation and page reloads.

## Requirements

1. **Create Static Application Configuration**:
   - Create `frontend/carebase-frontend/src/app/app.config.static.ts`:
     - Configure `provideRouter(routes, withViewTransitions(), withHashLocation())`.
     - Provide `{ provide: HOSPITAL_DATA_ACCESS, useClass: InMemoryHospitalDataAdapter }`.
     - Configure `IN_MEMORY_ADAPTER_CONFIG` with `seedDelayMs: 3000` and `migrateDelayMs: 10000`.

2. **Update Angular Workspace Configuration**:
   - In `frontend/carebase-frontend/angular.json`:
     - Add named configuration `"static"` under `projects.carebase-frontend.architect.build.configurations`:
       ```json
       "static": {
         "baseHref": "/carebase-angular/",
         "outputHashing": "all",
         "fileReplacements": [
           {
             "replace": "src/app/app.config.ts",
             "with": "src/app/app.config.static.ts"
           }
         ]
       }
       ```

3. **Add NPM Script**:
   - In `frontend/carebase-frontend/package.json`:
     - Add `"build:static": "ng build --configuration=static"`.

## Verification

- Running `npm run build:static` produces a production build in `dist/carebase-frontend/browser`.
- The generated `index.html` specifies `<base href="/carebase-angular/">`.
- The bundled static assets do not contain references to `HttpHospitalDataAdapter` or backend HTTP `/api` URLs.
