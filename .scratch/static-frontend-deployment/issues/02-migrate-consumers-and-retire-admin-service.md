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

## Comments

Implemented in accordance with requirements:
- Migrated `AdminPage` to inject `HOSPITAL_DATA_ACCESS` and invoke `migrateDatabase()` and `seedDatabase()`.
- Migrated `HeaderLayout` to inject `HOSPITAL_DATA_ACCESS` and bind `dbStatus` and `isMongo` computeds to `hospitalDataAccess.getDatabaseStatus()`.
- Enhanced `provideTestHospitalData()` and `InMemoryHospitalDataAdapter` with `isLoading?: boolean` and nullable `dbType` support for testing 'Connecting...' and 'Offline' badges deterministically.
- Updated unit test suites (`admin-page.spec.ts`, `header-layout.spec.ts`, `app.spec.ts`) to use `provideTestHospitalData()`.
- Retired and deleted `AdminService` (`admin-service.ts`) and its unit test suite (`admin-service.spec.ts`).
- Updated ADR-0003 documentation to reflect retirement of `provideTestAdminService()`.
- All 20 test files and 259 tests pass cleanly. Production build and typecheck succeeded.

