# Absorb Admin Operations into Hospital Data Access Seam

Status: resolved

## Context

Administrative database operations (`/api/status`, `/api/admin/seed`, `/api/admin/migrate`) currently bypass the hexagonal data access seam via an unseamed `AdminService`. This ticket expands the `HospitalDataAccess` port interface and implements database administration across both `HttpHospitalDataAdapter` and `InMemoryHospitalDataAdapter`.

## Requirements

1. **Update `HospitalDataAccess` Port Interface**:
   - In `frontend/carebase-frontend/src/app/services/hospital-data-access.ts`:
     - Add `getDatabaseStatus(): ResourceRef<DbStatus | undefined>`
     - Add `seedDatabase(): Promise<{ success: boolean; message: string }>`
     - Add `migrateDatabase(): Promise<{ success: boolean; message: string }>`

2. **Implement Methods in `HttpHospitalDataAdapter`**:
   - In `frontend/carebase-frontend/src/app/services/http-hospital-data-adapter.ts`:
     - Implement `getDatabaseStatus()` using `httpResource<DbStatus>(() => '/api/status', { injector: this.injector })`
     - Implement `seedDatabase()` via `firstValueFrom(this.http.post<{ success: boolean; message: string }>('/api/admin/seed', {}))`
     - Implement `migrateDatabase()` via `firstValueFrom(this.http.post<{ success: boolean; message: string }>('/api/admin/migrate', {}))`

3. **Implement Methods and Simulation in `InMemoryHospitalDataAdapter`**:
   - In `frontend/carebase-frontend/src/app/services/in-memory-hospital-data-adapter.ts`:
     - Define `InMemoryAdapterConfig` and `IN_MEMORY_ADAPTER_CONFIG` injection token with optional `seedDelayMs`, `migrateDelayMs`, and `initialDbType`.
     - Maintain an internal reactive `dbStatus` signal initialized to `initialDbType ?? 'MariaDB'`.
     - Implement `getDatabaseStatus()` returning a `ResourceRef` derived from `dbStatus`.
     - Implement `migrateDatabase()`: wait for `migrateDelayMs` (if configured), update `dbStatus` to `'MongoDB'`, and return `{ success: true, message: 'Migration completed! MariaDB records successfully transferred and switched to MongoDB.' }`.
     - Implement `seedDatabase()`: wait for `seedDelayMs` (if configured), reset internal fixtures, update `dbStatus` to `'MariaDB'`, and return `{ success: true, message: 'Database successfully populated with randomized test data.' }`.
     - Update `provideTestHospitalData(options?: TestHospitalDataOptions)` to default delays to `0ms`.

## Verification

- `HospitalDataAccess` interface reflects the new administrative methods.
- Both `HttpHospitalDataAdapter` and `InMemoryHospitalDataAdapter` compile cleanly without missing members.
- Unit specs for `in-memory-hospital-data-adapter.spec.ts` verify status inspection, migration to MongoDB, fixture seeding reset, and delay configuration.

## Comments

Implemented in accordance with requirements:
- Extended `HospitalDataAccess` port interface with `getDatabaseStatus()`, `seedDatabase()`, and `migrateDatabase()`.
- Implemented HTTP administrative transport in `HttpHospitalDataAdapter`.
- Implemented in-memory reactive database status tracking and simulated delays in `InMemoryHospitalDataAdapter`.
- Added comprehensive unit test coverage in `in-memory-hospital-data-adapter.spec.ts` and `http-hospital-data-adapter.spec.ts`.
