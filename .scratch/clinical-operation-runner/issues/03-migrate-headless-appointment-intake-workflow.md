# 03: Migrate Headless Appointment Intake Workflow & 409 Conflict Handling

**What to build:** Refactor the headless Appointment intake workflow state machine to delegate appointment booking mutations to the `OperationRunner`. The workflow eliminates its internal submission loading flag in favor of the runner's interaction lock. When a concurrent booking collision occurs (HTTP 409 `BookingConflictError`), the runner's error resolver intercepts the failure, automatically clears the conflicting Time Slot, reloads available slots for the Doctor, and returns structured conflict status so the user can be guided to select an alternate slot.

**Blocked by:** 01: Implement Core OperationRunner Service, Signal Forms Bridge, and Feedback Delivery

**Status:** resolved

- [x] `AppointmentIntakeWorkflow.submit()` delegates mutative booking execution to `OperationRunner`.
- [x] Internal `_isSubmitting` signal in `AppointmentIntakeWorkflow` is replaced by the runner's lockout state.
- [x] HTTP 409 `BookingConflictError` is handled through the runner's error resolution to clear the conflicting Time Slot and reload available Time Slots.
- [x] Returns structured operation result indicating success, conflict, or general failure without throwing unhandled exceptions.
- [x] Preserves existing reactive query behavior for patient search, department filtering, and date selection.
- [x] Headless unit tests verify booking submission, conflict recovery, time slot reload, and lockout transitions.
