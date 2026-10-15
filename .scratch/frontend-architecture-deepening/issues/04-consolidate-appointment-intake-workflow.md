# Consolidate Appointment Intake Workflow and Adopt linkedSignal

Status: ready-for-agent

## Context

`ClerkUseCase` currently duplicates 28 signals and 10 forwarding methods to wrap `AppointmentIntakeWorkflow`, and two separate test suites (1,430 lines) test the exact same intake sequence. This ticket consolidates workflow state into the component and adopts Angular v21+ `linkedSignal` for cascading step resets.

## Requirements

1. Re-unify `AppointmentIntakeWorkflow` state and logic directly into `ClerkUseCase` (or provide the workflow cleanly without mirroring properties).
2. Refactor cascading selection state to use `linkedSignal`:
   - `selectedDoctor` resets to `null` when `selectedDepartment` changes.
   - `selectedTimeSlot` resets to `null` when `selectedDoctor` or `selectedDate` changes.
3. Eliminate all 28 pass-through property accessors on the component class.
4. Bind Signal Forms directly to the intake booking model.
5. Consolidate tests into `clerk-use-case.spec.ts` using Angular Material harnesses (`MatStepperHarness`, `MatAutocompleteHarness`, `MatButtonHarness`, `MatSelectHarness`).
6. Retire the headless duplicate test suite `appointment-intake-workflow.spec.ts`.
7. Verify all tests pass with `npx ng test --watch=false`.

## Verification

- The 28 forwarded signals on `ClerkUseCase` are eradicated.
- Step resets work declaratively via `linkedSignal`.
- Duplicate test suite is removed while all user workflows are verified via Material harnesses.
- `npx ng test --watch=false` passes cleanly.
