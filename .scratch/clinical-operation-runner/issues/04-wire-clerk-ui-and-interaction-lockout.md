# 04: Wire Clerk UI Stepper & Interaction Lockout to OperationRunner

**What to build:** Update the Clerk appointment intake user interface to integrate with the `OperationRunner`'s ambient interaction lockout and centralized notifications. Booking confirmation actions bind to the runner's locked state to prevent duplicate submissions from rapid clicks or stepper interaction. Imperative snackbar calls are removed from the component, relying on runner feedback and conflict handling to navigate the Clerk back to the Time Slot selection step when a scheduling collision occurs.

**Blocked by:** 03: Migrate Headless Appointment Intake Workflow & 409 Conflict Handling

**Status:** resolved

- [x] Clerk booking confirmation button and interactive controls bind to the runner's `isLocked` signal.
- [x] Imperative `MatSnackBar` calls are eliminated from `ClerkUseCase.confirmBooking()`.
- [x] When a 409 booking conflict occurs, the UI transitions back to the Time Slot selection step with clear conflict feedback.
- [x] Form validation gating prevents submission when appointment notes exceed allowed constraints.
- [x] Component test suite verifies booking completion, interaction locking, conflict step redirection, and notification presentation via Angular Material harnesses.
