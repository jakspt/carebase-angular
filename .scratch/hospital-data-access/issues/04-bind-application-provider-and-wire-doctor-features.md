# 04: Bind Application Provider and Wire Doctor Features to HospitalDataAccess Port

**What to build:** Bind the `HOSPITAL_DATA_ACCESS` port to `HttpHospitalDataAdapter` in `app.config.ts`. Refactor `DoctorUseCase` and `DoctorReport` components to inject `HOSPITAL_DATA_ACCESS` instead of `DoctorService`. Remove unwrapping boilerplate in doctor components since the adapter delivers unwrapped models. Refactor `doctor-use-case.spec.ts` and `doctor-report.spec.ts` to provide `InMemoryHospitalDataAdapter`, eliminating HTTP mocking and verifying end-to-end component behavior against deterministic in-memory state.

**Blocked by:** 02: Implement Production HttpHospitalDataAdapter with httpResource and Envelope Unwrapping, 03: Implement Deterministic InMemoryHospitalDataAdapter for Test Suites

**Status:** ready-for-agent

## Acceptance Criteria

- [ ] `app.config.ts` binds `{ provide: HOSPITAL_DATA_ACCESS, useClass: HttpHospitalDataAdapter }`.
- [ ] `DoctorUseCase` injects `HOSPITAL_DATA_ACCESS` and consumes unwrapped `Patient[]`, `Patient | null`, and `Medication[]` directly.
- [ ] `DoctorReport` injects `HOSPITAL_DATA_ACCESS` to retrieve the earnings report.
- [ ] `doctor-use-case.spec.ts` and `doctor-report.spec.ts` use `providers: [{ provide: HOSPITAL_DATA_ACCESS, useClass: InMemoryHospitalDataAdapter }]`.
- [ ] All doctor component tests pass cleanly without `HttpTestingController` or mock spies.
- [ ] Production build succeeds without errors (`ng build`).
