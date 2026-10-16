# Migrate Consumers and Retire AdminService

Status: ready-for-agent

## Context

With administrative capabilities incorporated into `HospitalDataAccess`, consuming components (`AdminPage`, `HeaderLayout`) and test suites must be updated to inject the hexagonal port directly. Once migrated, `AdminService` and its ad-hoc test mock `provideTestAdminService` will be retired.

## Requirements

1. **Update `AdminPage`**:
   - In `frontend/carebase-frontend/src/app/admin-page/admin-page.ts`:
     - Inject `HOSPITAL_DATA_ACCESS` instead of `AdminService`.
     - Update `migrateDb()` to call `hospitalDataAccess.migrateDatabase()`.
     - Update `seedDb()` to call `hospitalDataAccess.seedDatabase()`.

2. **Update `HeaderLayout`**:
   - In `frontend/carebase-frontend/src/app/header-layout/header-layout.ts`:
     - Inject `HOSPITAL_DATA_ACCESS` instead of `AdminService`.
     - Bind `dbStatus` and `isMongo` computeds to the resource returned by `hospitalDataAccess.getDatabaseStatus()`.

3. **Update Test Suites**:
   - In `src/app/admin-page/admin-page.spec.ts`:
     - Replace `provideTestAdminService()` with `provideTestHospitalData()`.
     - Confirm all action card dialogues, seed confirmations, and migration flows pass cleanly.
   - In `src/app/header-layout/header-layout.spec.ts`:
     - Replace `provideTestAdminService(adminOptions)` with `provideTestHospitalData({ dbType: ... })`.
     - Confirm toolbar badges ('Offline', 'MongoDB', 'Connecting...') render correctly.
   - In `src/app/app.spec.ts`:
     - Replace `provideTestAdminService()` with `provideTestHospitalData()`.

4. **Retire `AdminService`**:
   - Delete `src/app/services/admin-service.ts`.
   - Delete `src/app/services/admin-service.spec.ts`.

## Verification

- `AdminService` is completely removed from the codebase with zero remaining imports.
- All unit tests pass cleanly via `ng test --watch=false`.
