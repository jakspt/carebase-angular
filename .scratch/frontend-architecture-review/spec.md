Status: resolved

# Spec: Frontend Architecture Deepening & LOC Reduction

## Problem Statement

The CareBase frontend codebase suffers from structural bloat, artificial seams, and redundant indirection that inflate lines of code (LOC) and complicate maintenance:
1. Legacy forwarder services (`DoctorService` and `ClerkService`) act as shallow pass-through proxies over the hexagonal data access port and session state, creating dead code and useless forwarding tests without adding domain logic.
2. The in-memory data adapter monolith entangles reactive Angular signal/resource orchestration with three complex mathematical calculation engines (Time Slot allocation with 14-day lookahead, Doctor earnings aggregation, and Consultation Frequency calculations). This forces tests of algorithmic edge cases to run through heavy, asynchronous Angular resource harnesses rather than fast, deterministic pure functions.
3. The Appointment Intake module is divided by an artificial seam between the UI component and workflow service, forcing the component to maintain ~60 repetitive signal and method forwarder aliases. Furthermore, duplicate test suites test the exact same intake flows twice through both the headless workflow and the full component harness, inflating the intake module test surface to over 1,190 lines.
4. Method and type naming in the data access port (`PatientVisitsReport`) diverges from the project's canonical domain glossary term (`Consultation Frequency Report`).

## Solution

1. Retire the shallow forwarders: delete the unused `DoctorService`, `ClerkService`, and their redundant test suites, routing consumers directly to the hexagonal data access port and session state.
2. Deepen the in-memory adapter: extract the Time Slot allocation, Doctor earnings calculation, and Consultation Frequency calculation into pure domain engine functions while preserving 100% of the dependency injection port contract (`HOSPITAL_DATA_ACCESS`) and test provider so switching between HTTP and in-memory persistence remains identical.
3. Collapse the artificial seam in Appointment Intake: retain multi-file separation between the workflow state and view component, but eliminate the ~60 forwarding aliases by binding the component view directly to the workflow state, shrinking the component to a lean file managing only view/DOM concerns. Consolidate the test surface around the canonical Angular Material component harness suite while pruning redundant workflow flow tests.
4. Align data access naming with the canonical domain glossary (`getConsultationFrequencyReport` and `ConsultationFrequencyReport`).
5. Document these decisions and trade-offs in an Architectural Decision Record (ADR 0005).

## User Stories

1. As a Clerk, I want to search for patients by name or SSN during appointment intake, so that I can quickly select the patient requiring medical consultation.
2. As a Clerk, I want to filter hospital doctors by department, so that I can locate appropriate medical practitioners for the patient's condition.
3. As a Clerk, I want to view available 30-minute Time Slots for a chosen doctor and date, so that I can offer conflict-free booking times to the patient.
4. As a Clerk, I want to see the next available appointment date automatically when all Time Slots on the selected day are booked, so that I can guide the patient to an open slot within the next 14 days without manual date jumping.
5. As a Clerk, I want to record appointment booking notes and submit the intake form, so that the patient's appointment is confirmed in the hospital system.
6. As a Clerk, I want to receive immediate feedback when a booking conflict occurs due to another user reserving the same slot, so that I am returned to slot selection to pick an alternative time.
7. As a Clerk, I want to reset the intake workflow at any point or after completion, so that I can begin scheduling an appointment for the next patient.
8. As a Clerk, I want to review administrative Consultation Frequency Reports across doctors and departments for a chosen date range, so that I can monitor hospital visit distribution.
9. As a Doctor, I want to review my annual earnings reports based on completed treatments, so that I can track revenue generated from clinical interventions.
10. As a Frontend Developer, I want callers and tests to target the hexagonal data access port directly, so that I am not forced to navigate through shallow, zero-logic forwarder services.
11. As a Frontend Developer, I want time slot calculation rules and lookahead algorithms to be pure functions, so that I can unit test edge cases instantly without Angular DI, Zone.js, or async resource harnesses.
12. As a Frontend Developer, I want doctor earnings math and consultation frequency aggregation to be pure domain engines, so that calculation algorithms are isolated from persistence and reactive wrappers.
13. As a Frontend Developer, I want to switch between in-memory mock persistence and backend HTTP persistence seamlessly via standard dependency injection, so that offline development and production execution share identical contracts.
14. As a Frontend Developer, I want the Appointment Intake view template to bind directly to the intake workflow state, so that the component does not require dozens of redundant property and method forwarding aliases.
15. As a Frontend Developer, I want a single, authoritative component-harness test suite for Appointment Intake following ADR 0003, so that the test surface is maintainable, fast, and free of redundant duplicate assertions.
16. As a Frontend Developer, I want the codebase terminology to match the canonical domain glossary, so that references to consultation statistics consistently use "Consultation Frequency Report" rather than "Patient Visits Report".
17. As an Architectural Contributor, I want the seam design and deep adapter principles documented in an ADR, so that future engineers understand the rationale for eliminating shallow forwarders and keeping calculations pure.

## Implementation Decisions

- **Retirement of Shallow Services**: The dead `DoctorService` and pass-through `ClerkService` are permanently deleted along with their dedicated test suite. Any consumers needing actor state or persistence access inject `ActorSession` and the `HOSPITAL_DATA_ACCESS` token directly.
- **Pure Domain Engine Seams**: Three pure functions are introduced to handle algorithmic calculations independently of Angular reactivity:
  - Time Slot Allocator: receives stored appointments and query parameters (doctor SSN, date, patient SSN) and computes available 30-minute slots between 08:00 and 17:00, including 14-day forward lookahead for the next open date when fully booked.
  - Doctor Earnings Calculator: receives stored appointments, doctor profiles, and target year, computing total treatment costs attributed to each doctor.
  - Consultation Frequency Aggregator: receives stored appointments, patient records, doctor records, and a date range, aggregating visit counts per patient-doctor combination.
- **In-Memory Adapter Deepening**: The in-memory data adapter continues to implement the hexagonal data access port and remains registered via the existing test provider. Its internal implementation delegates all calculations to the pure domain engines, slimming the adapter class down to reactive signal coordination, version bumping, and in-memory fixture arrays.
- **Multi-File Appointment Intake Decomposition**: The multi-file separation between the workflow state service and the intake view component is preserved. However, the component class is purged of all pass-through signal getters and forwarding methods. The view template references the injected workflow instance directly. The component class retains only view-level concerns (DOM focus management, stepper reset, and interaction coordination).
- **Test Suite Deduplication**: The component test suite is maintained as the primary behavioral test harness per ADR 0003, verifying the entire intake workflow through Angular CDK harnesses against the DOM. The secondary headless workflow test suite is pruned of duplicate multi-step flow scenarios, leaving only isolated unit checks for workflow-specific state transitions. Dedicated unit test suites are established for the pure calculation engines.
- **Domain Vocabulary Alignment**: The data access port interface, in-memory adapter, HTTP adapter, and report consumers rename `getPatientVisitsReport` to `getConsultationFrequencyReport` and `PatientVisitsReport` to `ConsultationFrequencyReport`. A backwards-compatible type alias is retained to ensure no external breakages.
- **ADR 0005 Recording**: A new Architectural Decision Record (ADR 0005) is authored under the project documentation documenting deep adapters, direct workflow seams, and forwarder retirement.

## Testing Decisions

- **Testing Seams**:
  - Primary Component Seam: User interactions (patient selection, doctor filtering, date/slot picking, booking confirmation) are tested through Angular Material CDK harnesses (`TestbedHarnessEnvironment`, `MatStepperHarness`, `MatSelectHarness`, `MatAutocompleteHarness`) against the Appointment Intake component mounted with `provideTestHospitalData()`. Tests assert observable DOM changes and state transitions without mocking internal methods or spying on port calls (respecting ADR 0003).
  - Pure Calculation Engine Seam: The time slot allocation, doctor earnings, and consultation frequency engines are tested at the function boundary with plain inputs and outputs (zero Angular dependencies, zero mocks, instant execution).
  - Hexagonal Adapter Seam: The in-memory and HTTP adapters are tested against the public port interface to verify resource creation, reactive updates, and error handling.
- **Prior Art**:
  - Component harness testing patterns follow `docs/adr/0003-frontend-testing-standards-and-harnesses.md`.
  - Hexagonal port testing follows existing test setups using `provideTestHospitalData()`.

## Out of Scope

- Consolidating the 16 signals of Consultation Frequency Report into a unified query engine (Candidate 4 from the architecture review).
- Refactoring the Clinical Action execution seam around `OperationRunner` across doctor and clerk workflows (Candidate 5 from the architecture review).
- Modifying backend Flask endpoints or changing HTTP URLs (`/api/clerk/reports/patient-visits`).
- Rewriting the HTML/CSS markup of the Appointment Intake stepper steps.

## Further Notes

- This refactoring delivers a net reduction of approximately 500-700 lines of redundant code and duplicate tests across the frontend without changing any user-facing behavior or UI design.
- All existing Vitest test suites must continue to pass before and after each refactoring step.
