# 05: Wire Clerk Workflow, Reports, and Eliminate HTTP Mocking in Consumer Tests

**What to build:** Wire `AppointmentIntakeWorkflow` and `ClerkReport` to inject `HOSPITAL_DATA_ACCESS` directly. Remove envelope unwrapping from clerk components. Update `ClerkService` and `DoctorService` to delegate their data methods to `HospitalDataAccess` (or retain thin facades for backwards compatibility). Refactor `appointment-intake-workflow.spec.ts`, `clerk-use-case.spec.ts`, and `clerk-report.spec.ts` to provide `InMemoryHospitalDataAdapter`, eliminating `provideHttpClientTesting()`, `HttpTestingController`, and URL mocks across all consumer test suites. Verify the entire project test suite passes and production build succeeds.

**Blocked by:** 04: Bind Application Provider and Wire Doctor Features to HospitalDataAccess Port

**Status:** ready-for-agent

## Acceptance Criteria

- [ ] `AppointmentIntakeWorkflow` injects `HOSPITAL_DATA_ACCESS` and consumes unwrapped `Doctor[]`, `Patient[]`, `Clerk[]`, and `TimeSlotsResult` directly.
- [ ] `ClerkReport` injects `HOSPITAL_DATA_ACCESS` for visit summary reports.
- [ ] `ClerkService` and `DoctorService` delegate data operations to `HOSPITAL_DATA_ACCESS` or retain compatibility wrappers.
- [ ] `appointment-intake-workflow.spec.ts`, `clerk-use-case.spec.ts`, and `clerk-report.spec.ts` provide `InMemoryHospitalDataAdapter` and eliminate `HttpTestingController` and raw URL mocking.
- [ ] Full unit test suite passes cleanly (`npm test -- --watch=false`).
- [ ] Full production build succeeds without errors (`ng build`).
