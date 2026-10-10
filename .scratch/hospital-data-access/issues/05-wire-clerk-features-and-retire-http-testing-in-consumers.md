# 05: Wire Clerk Workflow, Reports, and Eliminate HTTP Mocking in Consumer Tests

**What to build:** Wire `AppointmentIntakeWorkflow` and `ClerkReport` to inject `HOSPITAL_DATA_ACCESS` directly. Remove envelope unwrapping from clerk components. Update `ClerkService` and `DoctorService` to delegate their data methods to `HospitalDataAccess` (or retain thin facades for backwards compatibility). Refactor `appointment-intake-workflow.spec.ts`, `clerk-use-case.spec.ts`, and `clerk-report.spec.ts` to provide `InMemoryHospitalDataAdapter`, eliminating `provideHttpClientTesting()`, `HttpTestingController`, and URL mocks across all consumer test suites. Verify the entire project test suite passes and production build succeeds.

**Blocked by:** 04: Bind Application Provider and Wire Doctor Features to HospitalDataAccess Port

**Status:** resolved

## Acceptance Criteria

- [x] `AppointmentIntakeWorkflow` injects `HOSPITAL_DATA_ACCESS` and consumes unwrapped `Doctor[]`, `Patient[]`, `Clerk[]`, and `TimeSlotsResult` directly.
- [x] `ClerkReport` injects `HOSPITAL_DATA_ACCESS` for visit summary reports.
- [x] `ClerkService` and `DoctorService` delegate data operations to `HOSPITAL_DATA_ACCESS` or retain compatibility wrappers.
- [x] `appointment-intake-workflow.spec.ts`, `clerk-use-case.spec.ts`, and `clerk-report.spec.ts` provide `InMemoryHospitalDataAdapter` and eliminate `HttpTestingController` and raw URL mocking.
- [x] Full unit test suite passes cleanly (`npm test -- --watch=false`).
- [x] Full production build succeeds without errors (`ng build`).

## Comments

- Refactored `AppointmentIntakeWorkflow` to inject `HOSPITAL_DATA_ACCESS`, consuming unwrapped domain models and handling `BookingConflictError` seamlessly.
- Refactored `ClerkReport` to inject `HOSPITAL_DATA_ACCESS` directly for visit reports.
- Converted `ClerkService` and `DoctorService` into thin compatibility facade services delegating data queries and operations to `HOSPITAL_DATA_ACCESS`.
- Updated `appointment-intake-workflow.spec.ts`, `clerk-use-case.spec.ts`, `clerk-report.spec.ts`, and `clerk-service.spec.ts` to provide `InMemoryHospitalDataAdapter`, eliminating `provideHttpClientTesting()`, `HttpTestingController`, and URL mocks across consumer test suites.
- Verified all 155 unit tests pass cleanly across 19 test suites (`npx ng test --watch=false`).
- Verified production build succeeds cleanly (`npm run build`).
