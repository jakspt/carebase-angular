# Static Frontend Deployment and Hexagonal Admin Seam

CareBase frontend supports standalone static hosting (such as GitHub Pages) by folding all administrative database operations into the hexagonal `HospitalDataAccess` port and configuring compile-time adapter substitution via Angular `fileReplacements`. To guarantee 100% reliable routing on static hosts without server-side rewrite rules or custom 404 redirection flashes, the static deployment target adopts Angular hash location routing (`withHashLocation()`).

## Context & Problem

CareBase is architected around a dual-database design (relational MariaDB and document MongoDB). While clinical workflows were previously decoupled behind the hexagonal `HospitalDataAccess` port (ADR-0003), administrative operations (database status inspection, fixture seeding, and MongoDB migration) were routed through a standalone HTTP `AdminService`. This created a rogue transport bypass that prevented the frontend from running without an active backend and necessitated ad-hoc test doubles (`provideTestAdminService`). Furthermore, hosting an Angular single-page application on static providers like GitHub Pages presents two challenges: handling project subpath base URLs (`/carebase-angular/`) and preventing HTTP 404 errors when refreshing non-root route URLs.

## Decision

1. **Hexagonal Seam Absorption**:
   Extend the `HospitalDataAccess` port interface with administrative commands and database status querying:
   - `getDatabaseStatus(): ResourceRef<DbStatus | undefined>`
   - `seedDatabase(): Promise<{ success: boolean; message: string }>`
   - `migrateDatabase(): Promise<{ success: boolean; message: string }>`
   Retire `AdminService` and its ad-hoc test stub `provideTestAdminService()`. Consumers (`AdminPage`, `HeaderLayout`) inject `HOSPITAL_DATA_ACCESS` directly.

2. **Dual-Adapter Strategy & In-Memory Emulation**:
   - `HttpHospitalDataAdapter`: Communicates with backend REST endpoints (`/api/status`, `/api/admin/seed`, `/api/admin/migrate`) for full-stack environments.
   - `InMemoryHospitalDataAdapter`: Manages reactive database status transitions (`MariaDB` vs `MongoDB`) and fixture re-seeding completely in browser memory. Configurable simulated delays allow the static demo to exhibit realistic 3s (seeding) and 10s (migration) progress spinners, while test suites (`provideTestHospitalData()`) default to instantaneous execution (0ms) to preserve fast, deterministic Vitest runs.

3. **Compile-Time Build Substitution**:
   Configure a `static` build configuration in `angular.json` that uses `fileReplacements` to replace `src/app/app.config.ts` with `src/app/app.config.static.ts`. This allows Angular's esbuild bundler to completely tree-shake out `HttpHospitalDataAdapter` and HTTP infrastructure from the static demo bundle.

4. **Hash Location Strategy on Static Hosts**:
   In `app.config.static.ts`, initialize the Angular router with `withHashLocation()`. Because URI fragments (`/#/...`) are processed entirely client-side and never sent over HTTP, direct navigation and browser refreshes work flawlessly across any static file server without requiring custom 404 redirection scripts or server-side URL rewrites.

5. **Automated Continuous Deployment**:
   Deploy the static build to GitHub Pages via an automated GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) triggered on pushes to `main` with paths scoped to the frontend and workflow configurations.
