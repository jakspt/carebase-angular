# Configure Static Build and Hash Routing

Status: resolved

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

## Answer

Implemented in accordance with requirements:
- Created `frontend/carebase-frontend/src/app/app.config.static.ts` configuring `provideRouter(routes, withViewTransitions(), withHashLocation())`, binding `HOSPITAL_DATA_ACCESS` to `InMemoryHospitalDataAdapter`, and configuring `IN_MEMORY_ADAPTER_CONFIG` with `seedDelayMs: 3000` and `migrateDelayMs: 10000`.
- Added unit test suite `frontend/carebase-frontend/src/app/app.config.static.spec.ts` verifying hash location strategy, in-memory adapter binding, and simulated delays.
- Configured `"static"` build target in `frontend/carebase-frontend/angular.json` with `baseHref: "/carebase-angular/"`, `outputHashing: "all"`, and `fileReplacements` swapping `app.config.ts` for `app.config.static.ts`.
- Added `"build:static": "ng build --configuration=static"` script to `frontend/carebase-frontend/package.json`.
- Verified production static compilation via `npm run build:static`, confirming `<base href="/carebase-angular/">` in `dist/carebase-frontend/browser/index.html` and zero references to `HttpHospitalDataAdapter` or `/api` URLs in the compiled JavaScript bundle.
- All 21 test files and 262 tests pass cleanly via `ng test --watch=false`. Typecheck and formatting checks pass without errors.
