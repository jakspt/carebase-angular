# 03: Adopt Angular v22 Signal Forms in Review Step

**What to build:** Replace legacy template-driven `FormsModule` in the consultation review step with modern Angular v22 Signal Forms (`@angular/forms/signals`). Define a typed form model and schema for booking notes/reason, and bind the review step's form input and submit handler using `form()`, `FormField`, and `submit()`, aligning with the existing pattern in `DoctorUseCase`.

**Blocked by:** 01: Extract Headless AppointmentIntakeWorkflow Core State Machine

**Status:** resolved

## Acceptance Criteria

- [x] Define `BookingNotesModel` interface (e.g. `{ reason: string }`).
- [x] Implement Signal Form using `form()` with schema validation if required.
- [x] Connect form submission via `submit()` to trigger booking.
- [x] Form state is reset when the intake workflow is reset.
- [x] Unit tests verify Signal Form integration and validation.

## Comments

- Defined `BookingNotesModel` interface and added `bookingModel`, `bookingForm` using `form()` and `maxLength()` from `@angular/forms/signals`.
- Updated workflow `submit()` and `reset()` to synchronize with the Signal Form model.
- Added comprehensive unit tests in `src/app/clerk-use-case/appointment-intake-workflow.spec.ts`.
- All tests and `ng build` cleanly pass.
