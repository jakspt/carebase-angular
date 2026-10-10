# 04: Refactor ClerkUseCase to Thin Presentational Shell and Delete Production Backdoors

**What to build:** Slim down `ClerkUseCase` into a purely presentational shell that delegates state machine orchestration to `AppointmentIntakeWorkflow` (scoped to component providers). Handle HTTP 409 conflict navigation purely in the component by setting `stepper.selectedIndex = 2`. Permanently eliminate all production test backdoor signals (`allDoctorsSignal`, `timeSlotsSignal`, `nextAvailableDateSignal`). Update existing component tests to verify UI rendering and interactions via public component/workflow interfaces without type casting through backdoor signals.

**Blocked by:** 02: Implement Decoupled 409 Conflict Handling and Structured BookingResult, 03: Adopt Angular v22 Signal Forms in Review Step

**Status:** ready-for-agent

## Acceptance Criteria

- [ ] `AppointmentIntakeWorkflow` is provided on `ClerkUseCase` via `providers: [provideNativeDateAdapter(), AppointmentIntakeWorkflow]`.
- [ ] `ClerkUseCase` delegates patient search, doctor/department, date/time slot, and booking submission to the workflow.
- [ ] On booking conflict (`status === 'conflict'`), `ClerkUseCase` notifies user and navigates `stepper.selectedIndex = 2` without leaking `MatStepper` into domain logic.
- [ ] All production test backdoors (`allDoctorsSignal`, `timeSlotsSignal`, `nextAvailableDateSignal`) are permanently deleted.
- [ ] Review step template uses `@angular/forms/signals` (`FormField`, etc.) instead of `[(ngModel)]` / `FormsModule`.
- [ ] All existing component tests pass cleanly without using backdoors or `any` casts.
- [ ] `ng build` and all tests pass with 0 errors.

## Comments
