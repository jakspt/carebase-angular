# Deepen Consultation Frequency Report and Cleanse Test Backdoors

Status: ready-for-agent

## Context

`ClerkReport` currently exposes a mutable `reportDataSignal` test backdoor on its public class to facilitate unit testing. Furthermore, KPI aggregations (patients, doctors, consultations) and chart transformations are computed inline in the view component.

## Requirements

1. Remove `readonly reportDataSignal = signal<PatientVisitRecord[] | null>(null)` from `ClerkReport`.
2. Extract pure domain computation functions into a co-located module:
   - `computeConsultationKpis(records: PatientVisitRecord[])`: returns `{ totalUniquePatients, totalActiveDoctors, totalConsultations }`
   - `computeDoctorConsultationChart(records: PatientVisitRecord[])`: returns top-10 chart data items
3. Add unit tests covering these pure calculation functions directly with Vitest (no `TestBed`).
4. Update `ClerkReport` to derive its KPI and chart properties using `computed()` from the pure functions.
5. Extract debounced loading signal creation (`createDebouncedLoadingSignal`) into a shared reactive helper in `src/app/services/reactive-utils.ts` and share it across `ClerkReport`, `DoctorReport`, and `AppointmentIntakeWorkflow`.
6. Update `clerk-report.spec.ts` to assert observable table and chart behavior via component harnesses and `provideTestHospitalData()` without touching backdoor signals.
7. Verify all tests pass with `npx ng test --watch=false`.

## Verification

- No test backdoor signals exist on `ClerkReport`.
- Pure calculations are unit-tested without TestBed.
- `npx ng test --watch=false` passes cleanly.
