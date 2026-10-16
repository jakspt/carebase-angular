# Static Frontend Deployment and Hexagonal Admin Seam

Status: ready-for-agent

## Problem Statement

CareBase is an educational hospital information system demonstrating a dual-database architecture with interchangeable relational MariaDB and document MongoDB persistence. While the application's clinical operations (scheduling appointments, querying doctors, recording treatments, and analytical reports) were abstracted behind a hexagonal data access port with an in-memory adapter, the application cannot currently be hosted or demonstrated independently as a static web application (such as on GitHub Pages).

This limitation stems from three main problems:
1. **Administrative Transport Bypass**:
   Database administration capabilities (inspecting database persistence mode, populating fixture data, and executing the NoSQL schema migration) are implemented through a direct HTTP service rather than the hexagonal data access port. This bypass breaks architectural consistency, prevents the frontend from running without an active Flask backend, and forces test suites to rely on an ad-hoc test mock rather than the unified in-memory data adapter.

2. **Static Host Single-Page Application (SPA) Routing Incompatibility**:
   Static file hosts (such as GitHub Pages) serve static assets from disk and lack native server-side URL rewrite fallbacks to the root document. Direct navigation to sub-routes or browser refreshes result in HTTP 404 errors unless an appropriate client-side routing strategy is applied.

3. **Absence of Production Static Distribution & CI/CD**:
   The frontend build pipeline only supports connected production and development configurations. There is no automated build target or continuous deployment workflow to package and deploy a self-contained static demo with zero backend dependencies.

## Solution

Enable seamless, standalone static deployment of the CareBase Angular frontend to static hosting environments (specifically GitHub Pages) while simultaneously deepening the frontend architecture:

1. **Absorb Administrative Operations into Hexagonal Data Access**:
   Extend the hexagonal data access port interface to incorporate database status querying, fixture database seeding, and database schema migration. Implement these operations in the HTTP adapter (for live backend environments) and in the in-memory adapter (for test and static environments). Retire the shallow administrative service and its custom test double.

2. **Interactive In-Memory Persistence Simulation**:
   Equip the in-memory hospital data adapter with a reactive persistence state (initially MariaDB) that dynamically transitions to MongoDB upon executing migration, and re-seeds fixtures upon request. Support configurable simulated operation delays (3 seconds for seeding and 10 seconds for migration in static demo mode, and 0 milliseconds in test environments) so visitors experience realistic transaction loading states while unit tests remain instantaneous.

3. **Compile-Time Adapter Substitution & Hash Location Routing**:
   Introduce a dedicated static build configuration that replaces the application configuration entry point at compile time via build file replacements, completely tree-shaking out HTTP adapters and network dependencies. Configure the static router with a hash location strategy to guarantee reliable direct linking and refreshing on any static web server without redirect scripts or HTTP 404 flashes.

4. **Automated GitHub Pages CI/CD Pipeline**:
   Provide an automated GitHub Actions deployment workflow that builds the static application with dynamic subpath base URL resolution and publishes it directly to GitHub Pages on pushes to the default branch.

## User Stories

1. As a Showcase Visitor, I want to explore the CareBase frontend on GitHub Pages without requiring a local backend or database installation, so that I can evaluate the application instantly in my browser.
2. As a Showcase Visitor, I want to navigate directly to any page or refresh my browser without encountering an HTTP 404 error, so that my browsing experience is smooth and reliable.
3. As a Showcase Visitor, I want to see the database status indicator in the header bar reflect MariaDB when I first launch the application, so that I understand the initial relational persistence state.
4. As a Showcase Visitor, I want to trigger the NoSQL migration from the Admin page and observe a realistic loading dialog with informative progress messages, so that I can experience the dual-database migration narrative.
5. As a Showcase Visitor, I want the header database status badge to update reactively to MongoDB after running the migration, so that the architectural switch is immediately noticeable across the entire interface.
6. As a Showcase Visitor, I want to run database seeding from the Admin page and observe the transaction loading dialog, so that I can re-populate sample hospital data on demand.
7. As a Showcase Visitor, I want database seeding to reset the in-memory database status back to MariaDB, so that I can repeatedly demo the full migration journey from scratch.
8. As a System Administrator, I want database status inspection, seeding, and migration to be invoked through the unified hospital data access seam, so that persistence operations behave consistently across both real and simulated environments.
9. As a Hospital Clerk, I want to schedule appointments and view schedules in the static demo, so that I can test clinical intake workflows with rich pre-populated fixtures.
10. As a Doctor, I want to search patients, view medical histories, and record treatments in the static demo, so that clinical documentation workflows can be evaluated without a live database.
11. As a Frontend Maintainer, I want the administrative service and its ad-hoc test mock deleted, so that the codebase maintains exactly one data access abstraction.
12. As a Frontend Maintainer, I want the static build to completely tree-shake HTTP transport logic and network endpoints out of the static bundle, so that static demo users do not experience failed background network requests.
13. As a Frontend Maintainer, I want simulated administrative operation delays to default to zero milliseconds in unit test suites, so that test suites run in milliseconds without timeout flakes.
14. As a Frontend Maintainer, I want simulated administrative delays configurable via dependency injection, so that demo runtimes can configure realistic timing without touching component code.
15. As a Frontend Maintainer, I want a single command to build the static application locally, so that I can verify the static bundle before committing.
16. As a DevOps Engineer, I want GitHub Actions to automatically build and deploy the static frontend to GitHub Pages on pushes to the main branch, so that the live demo is continuously updated without manual steps.
17. As a DevOps Engineer, I want the deployment pipeline to trigger only on relevant frontend and workflow changes, so that backend Flask or documentation commits do not waste CI runner minutes.
18. As an Automated Testing Agent, I want all administrative workflows tested via Material CDK harnesses against the in-memory adapter, so that tests verify observable user-facing behavior rather than implementation details.
19. As an Automated Testing Agent, I want `provideTestHospitalData()` to be the sole provider required for testing clinical and administrative features across the application, in compliance with ADR-0003 and ADR-0004.

## Implementation Decisions

1. **Hexagonal Data Access Seam Extension**:
   - Extend the `HospitalDataAccess` interface to include administrative methods:
     - `getDatabaseStatus(): ResourceRef<DbStatus | undefined>`
     - `seedDatabase(): Promise<{ success: boolean; message: string }>`
     - `migrateDatabase(): Promise<{ success: boolean; message: string }>`
   - All read operations across the seam return Angular `ResourceRef<T>` objects, and all mutation/command operations return `Promise<T>`.

2. **HTTP Adapter Implementation**:
   - In `HttpHospitalDataAdapter`, implement `getDatabaseStatus()` using Angular's `httpResource` querying the backend status endpoint.
   - Implement `seedDatabase()` and `migrateDatabase()` by executing HTTP POST requests and resolving the response via `firstValueFrom`.

3. **In-Memory Adapter Emulation & Delay Configuration**:
   - In `InMemoryHospitalDataAdapter`, maintain an internal reactive signal representing the active database type (initialized to MariaDB).
   - Implement `getDatabaseStatus()` by exposing an Angular resource that tracks the reactive database status signal.
   - Implement `migrateDatabase()`: wait for the configured migration delay, transition the internal status signal to MongoDB, and return a descriptive completion message.
   - Implement `seedDatabase()`: wait for the configured seed delay, reset in-memory arrays (doctors, patients, clerks, appointments, treatments) back to baseline fixtures, reset the status signal to MariaDB, and return a completion message.
   - Define a configuration injection token (`IN_MEMORY_ADAPTER_CONFIG`) accepting optional configuration parameters:
     - `seedDelayMs?: number`
     - `migrateDelayMs?: number`
     - `initialDbType?: 'MariaDB' | 'MongoDB'`
   - Update `provideTestHospitalData()` to default all operation delays to 0 milliseconds, ensuring zero-latency test execution.

4. **Retirement of Administrative Transport Bypass**:
   - Refactor `AdminPage` and `HeaderLayout` to inject `HOSPITAL_DATA_ACCESS` instead of `AdminService`.
   - Delete `AdminService` and its ad-hoc `provideTestAdminService()` stub.
   - Direct all unit tests to supply `provideTestHospitalData()`.

5. **Static Application Configuration**:
   - Create a static application configuration module (`app.config.static.ts`) that:
     - Provides the Angular Router configured with `withHashLocation()` and `withViewTransitions()`.
     - Binds `HOSPITAL_DATA_ACCESS` to `InMemoryHospitalDataAdapter`.
     - Provides `IN_MEMORY_ADAPTER_CONFIG` with `seedDelayMs: 3000` and `migrateDelayMs: 10000`.

6. **Workspace Build Configuration**:
   - Add a named build configuration `static` under the Angular application architect options in `angular.json`.
   - Configure `fileReplacements` to substitute `src/app/app.config.ts` with `src/app/app.config.static.ts`.
   - Set `baseHref` to `/carebase-angular/`.
   - Add `build:static` script to `package.json`.

7. **GitHub Actions Continuous Deployment Workflow**:
   - Create a deployment workflow file `.github/workflows/deploy-pages.yml`.
   - Grant repository permissions: `contents: read`, `pages: write`, `id-token: write`.
   - Trigger on pushes to `main` with paths restricted to `frontend/carebase-frontend/**` and `.github/workflows/**`, and support `workflow_dispatch`.
   - Utilize `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, and `actions/deploy-pages@v4`.

## Testing Decisions

1. **Testing at the Highest Seam**:
   - All tests must interact strictly through user-visible controls using Angular CDK and Material Component Harnesses (`TestbedHarnessEnvironment`, `MatDialogHarness`, `MatToolbarHarness`, `ActionCardHarness`, `MatButtonHarness`).
   - Testing internal private fields, signal implementations, or spying on data access methods is prohibited.

2. **Single Hexagonal Test Provider**:
   - Replace all occurrences of `provideTestAdminService()` with `provideTestHospitalData()`.
   - `provideTestHospitalData()` provides the sole seam mock for both clinical and administrative tests.

3. **Zero-Delay Test Determinism**:
   - Tests execute with 0ms simulated delays to ensure instantaneous, deterministic test cycles under Vitest.

4. **Prior Art in the Codebase**:
   - Component harness tests in `src/app/admin-page/admin-page.spec.ts` and `src/app/header-layout/header-layout.spec.ts`.
   - In-memory data provider pattern in `src/app/services/in-memory-hospital-data-adapter.spec.ts`.

## Out of Scope

1. Backend Flask/Python persistence layer changes (endpoints `/api/*` remain untouched).
2. Database schema alterations for MariaDB or MongoDB.
3. Unrelated frontend deepening refactors (consolidating the appointment intake stepper or renaming feature directories), which remain tracked in separate issues.
4. Browser `localStorage` persistence (state remains intentionally ephemeral in memory).

## Further Notes

- Architecture decision recorded in `docs/adr/0004-static-frontend-deployment-and-hexagonal-admin-seam.md`.
- Implementation is structured into four sequential tickets under `.scratch/static-frontend-deployment/issues/`:
  - `01-absorb-admin-operations-into-hospital-data-access.md`
  - `02-migrate-consumers-and-retire-admin-service.md`
  - `03-configure-static-build-and-hash-routing.md`
  - `04-setup-github-actions-deployment-pipeline.md`
