# 04: Bind Application Provider and Wire Doctor Features to HospitalDataAccess Port

**What to build:** Bind the `HOSPITAL_DATA_ACCESS` port to `HttpHospitalDataAdapter` in `app.config.ts`. Refactor `DoctorUseCase` and `DoctorReport` components to inject `HOSPITAL_DATA_ACCESS` instead of `DoctorService`. Remove unwrapping boilerplate in doctor components since the adapter delivers unwrapped models. Refactor `doctor-use-case.spec.ts` and `doctor-report.spec.ts` to provide `InMemoryHospitalDataAdapter`, eliminating HTTP mocking and verifying end-to-end component behavior against deterministic in-memory state.

**Blocked by:** 02: Implement Production HttpHospitalDataAdapter with httpResource and Envelope Unwrapping, 03: Implement Deterministic InMemoryHospitalDataAdapter for Test Suites

**Status:** resolved

## Acceptance Criteria

- [x] `app.config.ts` binds `{ provide: HOSPITAL_DATA_ACCESS, useClass: HttpHospitalDataAdapter }`.
- [x] `DoctorUseCase` injects `HOSPITAL_DATA_ACCESS` and consumes unwrapped `Patient[]`, `Patient | null`, and `Medication[]` directly.
- [x] `DoctorReport` injects `HOSPITAL_DATA_ACCESS` to retrieve the earnings report.
- [x] `doctor-use-case.spec.ts` and `doctor-report.spec.ts` use `providers: [{ provide: HOSPITAL_DATA_ACCESS, useClass: InMemoryHospitalDataAdapter }]`.
- [x] All doctor component tests pass cleanly without `HttpTestingController` or mock spies.
- [x] Production build succeeds without errors (`ng build`).

## Comments

- Bound `HOSPITAL_DATA_ACCESS` to `HttpHospitalDataAdapter` in `src/app/app.config.ts`.
- Refactored `DoctorUseCase` to inject `HOSPITAL_DATA_ACCESS`, consuming unwrapped domain models directly and utilizing asynchronous `addTreatment` promise resolution.
- Refactored `DoctorReport` to inject `HOSPITAL_DATA_ACCESS.getDoctorEarningsReport()`.
- Updated `doctor-use-case.spec.ts` and `doctor-report.spec.ts` to run against `InMemoryHospitalDataAdapter` with zero HTTP controller mocking.
- All doctor feature tests and `ng build` cleanly passed with 0 errors.
