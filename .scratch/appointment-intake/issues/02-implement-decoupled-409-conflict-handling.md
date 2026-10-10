# 02: Implement Decoupled 409 Conflict Handling and Structured BookingResult

**What to build:** Implement structured `BookingResult` return type on the workflow's submission method `submit(reason?: string): Promise<BookingResult>`. Ambiently resolve the acting Clerk, validate required booking state, submit booking payload, handle concurrent HTTP 409 slot booking collisions by resetting the selected time slot, triggering a slot query refresh, and returning `{ status: 'conflict' }` without leaking UI stepper widget dependencies into the domain workflow.

**Blocked by:** 01: Extract Headless AppointmentIntakeWorkflow Core State Machine

**Status:** ready-for-agent

## Acceptance Criteria

- [ ] Define discrete domain union `BookingResult`:
  ```ts
  export type BookingResult =
    | { status: 'success'; appointmentId?: number }
    | { status: 'conflict' }
    | { status: 'validation_error'; message: string }
    | { status: 'error'; message: string };
  ```
- [ ] `submit(reason?: string)` performs validation and submits appointment request to `ClerkService`.
- [ ] On HTTP 409 conflict, `selectedTimeSlot` is cleared, `timeSlotsResource.reload()` is called, and `{ status: 'conflict' }` is returned.
- [ ] On successful submission, workflow state reflects booking success and stores created appointment ID.
- [ ] `reset()` cleanly restores all workflow state to initial defaults while preserving the active clerk session.
- [ ] Headless unit tests verify successful booking, validation error, HTTP 409 recovery, and HTTP 500 error handling.

## Comments
