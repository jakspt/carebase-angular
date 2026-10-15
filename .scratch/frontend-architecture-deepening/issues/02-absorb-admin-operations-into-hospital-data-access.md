# Absorb Admin Operations into Hospital Data Access Seam

Status: ready-for-agent

## Context

Admin operations (`/api/status`, `/api/admin/seed`, `/api/admin/migrate`) currently bypass the hexagonal data access seam via an unseamed `AdminService` and rely on an ad-hoc test mock (`provideTestAdminService`). This ticket absorbs these operations into `HospitalDataAccess` and deletes `AdminService`.

## Requirements

1. Update `HospitalDataAccess` port interface:
   - Add `getDatabaseStatus(): ResourceRef<DbStatus | undefined>`
   - Add `seedDatabase(): Promise<{ success: boolean; message: string }>`
   - Add `migrateDatabase(): Promise<{ success: boolean; message: string }>`
2. Implement methods in `HttpHospitalDataAdapter`:
   - `getDatabaseStatus()` uses `httpResource<DbStatus>(() => '/api/status', { injector: this.injector })`
   - `seedDatabase()` executes POST to `/api/admin/seed`
   - `migrateDatabase()` executes POST to `/api/admin/migrate`
3. Implement methods in `InMemoryHospitalDataAdapter`:
   - Maintain a reactive `dbType` signal initialized to `'MariaDB'`
   - `getDatabaseStatus()` exposes resource returning `{ dbType: this.dbType() }`
   - `migrateDatabase()` updates `this.dbType.set('MongoDB')` and returns success message
   - `seedDatabase()` resets sample data and returns success message
4. Update `AdminPage` and `HeaderLayout` to inject `HOSPITAL_DATA_ACCESS` instead of `AdminService`.
5. Update `admin-page.spec.ts` and `header-layout.spec.ts` to use `provideTestHospitalData()` instead of `provideTestAdminService()`.
6. Delete `src/app/services/admin-service.ts` and `src/app/services/admin-service.spec.ts`.
7. Verify all tests pass with `npx ng test --watch=false`.

## Verification

- `AdminService` is completely removed.
- `provideTestHospitalData()` supports all database status, seeding, and migration assertions.
- `npx ng test --watch=false` passes cleanly.
