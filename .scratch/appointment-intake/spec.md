# Appointment Intake Workflow Refactoring

Status: resolved

## Problem Statement

The Clerk appointment intake workflow in the hospital information system is currently implemented as a monolithic 426-line UI component that coordinates patient searches, doctor selections, calendar date constraints, time slot queries, concurrent conflict recovery, and submission.

Because the component mixes presentation, imperative event synchronization, and HTTP communication, understanding or modifying the intake flow requires navigating 25+ signals and RxJS pipelines in a single file. Upstream selection changes (such as changing the Department or Doctor) rely on imperative event callbacks to manually nullify downstream state, creating potential synchronization defects. Furthermore, to enable unit testing, the component was forced to expose production test backdoor signals (`allDoctorsSignal`, `timeSlotsSignal`, `nextAvailableDateSignal`), allowing tests to bypass the module's real interface and mutate internal signals through `any` type casts. Finally, the booking step uses legacy template-driven forms (`FormsModule`) with manual imperative validation, diverging from the project's standard Angular v22 Signal Forms architecture.

## Solution

Refactor the appointment intake flow into a **deep module** (`AppointmentIntakeWorkflow`) that encapsulates the state machine, reactive derivations, and backend communication behind a concise, intention-revealing public interface.

The UI component will be reduced to a purely presentational shell that renders the Angular Material Stepper and binds directly to the workflow. Dependent selections (such as resetting the Doctor when the Department changes, or resetting the Time Slot when the Doctor or Date changes) will be modeled declaratively using Angular's `linkedSignal`. Form validation and submission in the review step will use modern Signal Forms (`@angular/forms/signals`). Concurrent slot booking collisions (HTTP 409) will be captured and returned as a discrete domain result, allowing the UI component to handle step navigation without leaking stepper widget references into domain logic. The workflow module will be provided at the component injector level, guaranteeing automatic instantiation upon entry and automatic garbage collection on exit. Unit tests will exercise the workflow headlessly via Angular's standard HTTP testing utilities, permanently deleting all test backdoors from production code.

## User Stories

1. As a Clerk, I want to search for patients by name or Social Security Number (SSN) with debounced autocomplete, so that I can quickly select the patient requiring an Appointment.
2. As a Clerk, I want to see each patient's NACA Score and severity warning during selection, so that I am immediately informed of emergency triage status.
3. As a Clerk, I want to filter attending doctors by hospital Department, so that I can locate appropriate doctors without scanning the entire hospital medical staff.
4. As a Clerk, I want my selected doctor to reset automatically if I change to a Department where that doctor does not practice, so that I do not schedule an Appointment in the wrong clinical division.
5. As a Clerk, I want to choose a consultation date from today onward, so that past dates cannot be inadvertently selected.
6. As a Clerk, I want available 30-minute Time Slots to load automatically for the selected doctor, patient, and date, so that I can choose a conflict-free consultation window.
7. As a Clerk, I want my selected Time Slot to clear automatically whenever I change the attending doctor or the consultation date, so that obsolete slot selections do not persist across step changes.
8. As a Clerk, I want proactive date recommendations when all Time Slots on the selected date are booked, so that I can jump to the next available consultation day with a single click.
9. As a Clerk, I want to enter an optional consultation reason and clinical notes, so that the attending doctor understands the purpose of the visit.
10. As a Clerk, I want to review a complete booking summary showing the Patient, Doctor, Department, Date, Time Slot, and acting Clerk before submitting, so that I can verify all details with the patient.
11. As a Clerk, I want immediate feedback and automatic return to the date & time step if another user booked my chosen Time Slot concurrently (HTTP 409 conflict), so that I can promptly pick an alternative available window without losing patient or doctor context.
12. As a Clerk, I want the intake workflow to reset cleanly after a successful booking or when clicking "Schedule Another Appointment", so that I can immediately begin a new booking without residual data from the previous patient.
13. As a Clerk, I want the intake workflow state to automatically discard when I navigate away from the intake page, so that I am always presented with a fresh state upon returning.
14. As a Frontend Maintainer, I want the Appointment intake state machine and business rules isolated from Angular Material UI components, so that domain logic can be maintained and tested independently of template widgets.
15. As a Frontend Maintainer, I want dependent selections to be managed declaratively via `linkedSignal`, so that manual imperative callback resets are eliminated.
16. As a Frontend Maintainer, I want form validation and submission handled through modern Signal Forms, so that form management follows the project's standardized Angular v22 architecture.
17. As a Frontend Maintainer, I want to test the entire intake state machine headlessly against mock HTTP services without manipulating private component signals or rendering DOM harnesses, so that test suites are fast, robust, and resilient to template changes.
18. As a Frontend Maintainer, I want all production test backdoor signals eliminated from the codebase, so that production interfaces remain clean and callers cannot bypass public invariants.

## Implementation Decisions

1. **Deep Module Boundary**:
   - Extract the entire intake state machine, search orchestration, date boundary clamping, and submission logic into an `AppointmentIntakeWorkflow` module.
   - The UI component delegates all user actions to the workflow and renders its read-only signals.

2. **Component-Scoped Dependency Injection Lifecycle**:
   - Scope `AppointmentIntakeWorkflow` to the intake component injector (`providers: [AppointmentIntakeWorkflow]`).
   - Instantiation occurs automatically when the route is loaded, and destruction/garbage collection occurs automatically when navigating away, ensuring zero state pollution across visits without manual cleanup routines.

3. **Declarative Dependent State with `linkedSignal`**:
   - Replace manual event handler resets (`onDepartmentChange`, `onDoctorChange`, `onDateChange` nulling downstream signals) with `linkedSignal`.
   - `selectedDoctor` is a `linkedSignal` that resets to `null` if the department changes and the current doctor is not in that department.
   - `selectedTimeSlot` is a `linkedSignal` derived from `[selectedDoctor(), selectedDate()]` that resets to `null` whenever the doctor or date changes.

4. **Adoption of Angular v22 Signal Forms**:
   - Replace template-driven `FormsModule` (`[(ngModel)]`) in the consultation review step with `@angular/forms/signals`.
   - Implement type-safe schema validation on the booking notes model, aligning the clerk intake workflow with the existing doctor workflow.

5. **Decoupled 409 Conflict Handling**:
   - The workflow's submission command returns a structured result union:

     ```ts
     type BookingResult =
       | { status: 'success'; appointmentId?: number }
       | { status: 'conflict' }
       | { status: 'validation_error'; message: string }
       | { status: 'error'; message: string };
     ```

   - On HTTP 409, the workflow resets the slot, triggers a slot refresh, and returns `{ status: 'conflict' }`.
   - The UI component intercepts the conflict status sequentially and navigates the stepper widget to the slot selection index, eliminating any coupling between domain logic and `MatStepper`.

6. **Ambient Acting Clerk Resolution**:
   - The workflow retrieves the active Clerk Social Security Number (SSN) directly from the clerk session layer at submission time, keeping the public `submit()` command argument-free.

7. **Deletion of Production Test Backdoors**:
   - Delete `allDoctorsSignal`, `timeSlotsSignal`, and `nextAvailableDateSignal`.
   - Tests interact with the workflow through its real public interface.

## Testing Decisions

1. **Test External Behavior, Not Implementation Details**:
   - Tests must exercise the intake workflow through its public command methods (`selectPatient`, `selectDepartment`, `selectDoctor`, `selectDate`, `selectTimeSlot`, `submit`, `reset`) and observe state through public signals.
   - Do not test private variables, internal signal mechanics, or internal RxJS pipelines.

2. **Split Workflow Logic Tests from Presentation Tests**:
   - **Headless Workflow Unit Tests**: Test state transitions, `linkedSignal` cascading resets, date formatting, and HTTP 409 conflict handling in an isolated headless test suite using Angular's standard HTTP testing utilities (`provideHttpClientTesting`, `HttpTestingController`).
   - **Component Presentation Tests**: Test that the UI component correctly renders the workflow state, provides appropriate labels and NACA chips, and forwards button clicks to the workflow.

3. **Prior Art in the Codebase**:
   - Follow existing unit testing patterns established in the project using Vitest, zoneless testing principles, and `await fixture.whenStable()`.

## Out of Scope

- **Backend Endpoints and Persisted Contracts**: No modifications to `/api/clerk/*` endpoints or backend SQL/MongoDB database schemas.
- **Doctor and Admin Workflows**: Changes are strictly confined to the Clerk appointment intake use case.
- **Session Storage Mechanics**: Alterations to how the acting Clerk is stored or validated across browser sessions.
- **Visual Design and Theming**: The layout, typography, CSS styling, and visual presentation of the Angular Material Stepper and cards remain identical.
- **Appointment Cancellation and Rescheduling**: Modifying or cancelling existing appointments is tracked under separate backlog items.

## Further Notes

- This refactoring fulfills Candidate 1 ("Collapse the Appointment Intake Workflow") from the codebase architectural review.
- The terminology in this specification strictly conforms to the canonical domain definitions in `GLOSSARY.md` (Clerk, Doctor, Patient, Department, Appointment, Time Slot, SSN, NACA Score).
- Try to keep the current design of the frontend (fonts, typography, etc.). Also keep the "quiet" NACA score presentation.
