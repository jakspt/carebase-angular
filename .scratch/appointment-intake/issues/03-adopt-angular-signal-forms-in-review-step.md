# 03: Adopt Angular v22 Signal Forms in Review Step

**What to build:** Replace legacy template-driven `FormsModule` in the consultation review step with modern Angular v22 Signal Forms (`@angular/forms/signals`). Define a typed form model and schema for booking notes/reason, and bind the review step's form input and submit handler using `form()`, `FormField`, and `submit()`, aligning with the existing pattern in `DoctorUseCase`.

**Blocked by:** 01: Extract Headless AppointmentIntakeWorkflow Core State Machine

**Status:** ready-for-agent

## Acceptance Criteria

- [ ] Define `BookingNotesModel` interface (e.g. `{ reason: string }`).
- [ ] Implement Signal Form using `form()` with schema validation if required.
- [ ] Connect form submission via `submit()` to trigger booking.
- [ ] Form state is reset when the intake workflow is reset.
- [ ] Unit tests verify Signal Form integration and validation.

## Comments
