# Clinical Operation Runner Module

Status: ready-for-agent

## Problem Statement

Users across the hospital information system trigger mutative operations that carry clinical and administrative impact: an Administrator executes a database migration to MongoDB or seeds sample data; a Clerk schedules a patient Appointment; and a Doctor records a clinical Treatment with prescribed Medications.

Currently, each feature area implements its own mutative lifecycle imperatively and in isolation. The Admin module delegates to a standalone `TransactionDialog` component that manages modal progress and confirmation for database tasks, but remains disconnected from form validation. In contrast, the Doctor treatment workflow and Clerk intake workflow independently duplicate local loading state flags (`isSubmitting` signals), manual try/catch error handling, toast/snackbar notifications via `MatSnackBar`, and manual interaction disabling.

This fragmentation leads to inconsistent user experiences: in some places, operations can be double-submitted because interaction locking is incomplete; error formatting varies between raw HTTP error strings and generic messages; and testing mutative flows requires mocking UI snackbar services and stepper components across every test suite. Furthermore, the standalone `TransactionDialog` cannot be reused for standard form submissions, leaving mutative orchestration scattered across three different feature modules.

## Solution

Consolidate all mutative action orchestration into a deep **Operation Runner** module (`OperationRunner`).

The Operation Runner encapsulates the complete lifecycle of mutative actions behind a unified, robust interface that serves Administrator, Clerk, and Doctor workflows alike:

1. **User Confirmation**: Evaluates whether an action requires explicit user confirmation (e.g. high-risk actions such as database migration or database seeding) and displays a modal confirmation dialog before proceeding.
2. **Interaction Lockout**: Establishes an ambient interaction barrier while any mutation is in flight, preventing concurrent submissions, disabling navigation triggers, and displaying standardized progress feedback.
3. **Execution & Error Handling**: Executes the mutative command, intercepts errors, and resolves them into user-friendly domain error messages through configurable error resolvers.
4. **Feedback Presentation**: Unifies notification delivery through consistent snackbars or modal dialogs according to operation severity.
5. **Native Angular Signal Forms Integration**: Seamlessly bridges with Angular v22's Signal Forms `submit()` helper, eliminating boilerplate `isSubmitting` signals in feature components.
6. **ADR 0001 Preservation**: Fully respects ADR 0001 ("One-Way Migration and Independent SQL Seeding") by ensuring database migration switches persistence state to MongoDB while database seeding independently populates MariaDB without altering MongoDB runtime state.

## User Stories

1. As an Administrator, I want to trigger a database migration to MongoDB with a clear confirmation prompt and progress indicator, so that I do not accidentally trigger a schema migration while aware of its permanent runtime switch.
2. As an Administrator, I want database seeding to run with a confirmation warning that existing data will be overwritten, so that test data generation is intentional.
3. As an Administrator, I want database seeding to populate MariaDB without disrupting active MongoDB demonstration state, so that ADR 0001 invariants are strictly maintained.
4. As an Administrator, I want clear visual feedback upon completion or failure of database administration tasks, so that I know the persistence status of the system.
5. As a Clerk, I want appointment booking submissions to lock the user interface while in flight, so that duplicate Appointment requests are never submitted by accident.
6. As a Clerk, I want concurrent booking conflicts (HTTP 409) to be reported with clear guidance to select an alternate Time Slot, so that I can resolve scheduling collisions quickly.
7. As a Clerk, I want appointment booking validation errors reported clearly before submission, so that missing information can be corrected immediately.
8. As a Doctor, I want treatment recording to lock the submission button and display a loading indicator, so that I know clinical records are being persisted.
9. As a Doctor, I want successful Treatment recordings to display a standardized confirmation toast, so that I am assured the consultation was recorded.
10. As a Doctor, I want clear, readable error notifications if saving a Treatment or prescribed Medications fails, so that I can retry without losing entered clinical notes.
11. As a Frontend Maintainer, I want a single `OperationRunner` module governing all mutations across the application, so that submission orchestration is not duplicated across Admin, Clerk, and Doctor modules.
12. As a Frontend Maintainer, I want the Operation Runner to natively integrate with Angular v22 Signal Forms `submit()`, so that individual components do not need local `isSubmitting` signals.
13. As a Frontend Maintainer, I want high-impact operations (database migration/seeding) to configure confirmation dialogs through declarative options rather than embedding bespoke dialog components in feature pages.
14. As a Frontend Maintainer, I want interaction lockout handled centrally, so that double-click and concurrent submission vulnerabilities are universally eliminated.
15. As a Frontend Maintainer, I want error message extraction and user feedback decoupled from HTTP transport and component view logic, so that error presentation rules are maintained in one place.
16. As a Frontend Maintainer, I want to test mutation lifecycles headlessly without rendering Material dialogs or snackbars in every component test, so that test suites remain fast and reliable.

## Implementation Decisions

1. **Deep Operation Runner Service Interface**:
   - Provide an `OperationRunner` service exposing `execute(action, config)` for standalone or administrative tasks, and `submitForm(form, action, config)` for Signal Forms.
   - Prototype type shape:

     ```ts
     export interface OperationConfig<T> {
       title?: string;
       description?: string;
       confirmMessage?: string;
       loadingMessage?: string;
       successMessage?: string;
       requireConfirmation?: boolean;
       errorMessageResolver?: (error: unknown) => string;
     }

     export interface OperationResult<T> {
       status: 'success' | 'cancelled' | 'error';
       data?: T;
       error?: unknown;
     }
     ```

2. **Signal Forms Native Integration**:
   - Provide a bridge helper method that delegates to `@angular/forms/signals` `submit()`.
   - The runner evaluates form validity, establishes the interaction barrier, executes the mutation, and surfaces success or validation errors.
   - Eliminates manual `isSubmitting` signals across feature components.

3. **Interaction Lockout and Modal Confirmation**:
   - Exposes an `isLocked` signal that components bind to disable submit buttons and interactive controls.
   - When `requireConfirmation: true`, displays a lightweight modal dialog prompting the user to confirm or cancel before the action executes.
   - If the user cancels the confirmation, returns `{ status: 'cancelled' }` without invoking the mutative command.

4. **Standardized Feedback Presentation**:
   - Encapsulates `MatSnackBar` notifications and modal state inside the runner.
   - Automatically displays `loadingMessage`, `successMessage`, or resolved error messages without requiring callers to inject snackbar services.

5. **ADR 0001 Invariant Preservation**:
   - Admin database operations pass through the runner with `requireConfirmation: true`.
   - Preserves the behavioral contract that migration switches runtime persistence to MongoDB while seeding populates MariaDB independently.

## Testing Decisions

1. **Test External Behavior, Not Implementation Details**:
   - Tests verify that calling `execute` runs the action and reports success; test that cancellation halts execution; test that errors trigger the error resolver and return error status; test that `isLocked` accurately reflects in-flight state.
   - Do not assert on private timer delays or internal RxJS operators.

2. **Modules to Test**:
   - **Operation Runner Headless Tests**: Test lifecycle states (idle -> confirming -> executing -> success/error), confirmation cancellation, error resolution, and interaction lockout in a headless Vitest suite.
   - **Signal Forms Integration Tests**: Verify that `submitForm` halts execution when form fields are invalid and proceeds with the action when valid.
   - **Consumer Module Integration**: Verify that Admin, Clerk, and Doctor modules successfully delegate their mutations to the Operation Runner.

3. **Prior Art in the Codebase**:
   - Follow existing Vitest testing patterns and Angular dependency injection testing using `TestBed`.

## Out of Scope

- **Backend Endpoints and Database Migration Logic**: No modifications to `/api/admin/*` endpoints or server-side SQL/MongoDB persistence engines.
- **Clinical Validation Rules**: Business logic for NACA scores, appointment booking time rules, and medication prescriptions remains unchanged.
- **Visual Styling and Themes**: Button layouts, icons, and Angular Material card styles remain intact.

## Further Notes

- This refactoring fulfills Candidate 3 ("Consolidate Clinical Mutative Actions into an Operation Runner") from the codebase architectural review.
- The terminology in this specification strictly conforms to the canonical domain definitions in `GLOSSARY.md` (Doctor, Clerk, Patient, Department, Appointment, Time Slot, Treatment, Medication, SSN, NACA Score).
- In accordance with ADR 0001, database migration switches the runtime strategy to MongoDB while database seeding continues to populate MariaDB independently.
