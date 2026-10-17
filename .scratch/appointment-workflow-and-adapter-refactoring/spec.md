Status: ready-for-agent

# Spec: Appointment Workflow Decomposition, Adapter Deepening, and Shared Utilities

## Problem Statement

As the CareBase Angular frontend evolved, two core modules—the Appointment Intake Workflow and the In-Memory Hospital Data Adapter—accumulated excessive responsibilities, resulting in 400+ lines of code per file:

1. **Appointment Intake Workflow Monolith**: The workflow service simultaneously manages reactive step state for a 4-step wizard, inlines generic date parsing utilities, maintains an RxJS debouncing bridge, and contains an 85-line asynchronous submission engine that coordinates payload formatting, conflict detection, slot re-querying, and error message resolution. This creates high cognitive load and complicates unit testing of step transitions and submission failure modes.
2. **Duplicated Progress Spinner Logic**: The reactive debounced loading indicator pattern used by the appointment intake workflow is duplicated verbatim across administrative reports (Consultation Frequency Report) and financial reports (Doctor Earnings Report), creating maintenance drag and violating DRY principles.
3. **Flat Services Directory Congestion**: The services directory contains 17 flat files mixing pure mathematical calculation engines, hexagonal port contracts, HTTP and in-memory persistence adapters, mock fixture generators, authentication sessions, and UI operation runners.
4. **Adapter Boilerplate & Fragile Mock Primitives**: The in-memory hospital data adapter contains repetitive resource creation boilerplate across 9 query endpoints and constructs a fragile synthetic 20-line resource object for simulated database loading states.
5. **Domain Vocabulary Divergence**: In violation of the project glossary (`GLOSSARY.md`), which mandates "Appointment" and strictly forbids "Booking", several components, models, and errors use booking-oriented terminology (`bookingForm`, `BookingResult`, `BookingConflictError`).

## Solution

Decompose the monolithic appointment intake workflow and deepen the hexagonal persistence layer while keeping modules focused, cohesive, and aligned with domain terminology:

1. **Extract Reusable Utilities**: Move reactive debounced loading signals and ISO date parsing into dedicated shared utility modules, deduplicating progress spinner logic across intake workflows and reports.
2. **Organize Services by Sub-Domain**: Partition the services directory into cohesive subdirectories for calculation engines and data access, backed by a root barrel re-export for backward compatibility.
3. **Interface Segregation for Data Access**: Decompose the data access port into four capability interfaces (Scheduling, Clinical, Reporting, System) with dedicated dependency injection tokens aliased via Angular's `useExisting` to the underlying adapter.
4. **Tidy and Deepen the In-Memory Adapter**: Retain the in-memory adapter as a unified, deep simulation of hospital persistence, pruning repetitive resource boilerplate, simplifying database status queries, and aligning conflict errors with the domain glossary.
5. **Extract Appointment Submission Coordinator**: Decouple the 85-line async booking submission and conflict-recovery engine into a dedicated coordinator service, keeping the intake workflow focused strictly on stepper state and form validation.
6. **Harmonize Domain Vocabulary**: Standardize on canonical appointment terminology across forms and errors while preserving backward-compatible aliases for existing templates.

## User Stories

1. As a Clerk, I want appointment submission to handle scheduling conflicts gracefully, so that when a 409 conflict occurs, my selected time slot is cleared and available slots are automatically refreshed without losing my patient or doctor selections.
2. As a Clerk, I want patient search inputs to debounce queries automatically, so that searches remain snappy without firing unnecessary queries on every keystroke.
3. As a Clerk, I want loading spinners during patient search and slot lookups to debounce briefly, so that the UI does not flicker during fast sub-second queries.
4. As a Clerk, I want the appointment intake stepper to preserve my entered notes and department filters, so that navigating between steps does not clear my work.
5. As a Clerk, I want appointment intake to depend strictly on scheduling data operations, so that database maintenance and clinical treatments cannot accidentally be invoked from intake views.
6. As a Doctor, I want the annual earnings report to share standard debounced loading indicators, so that financial analytics present a consistent, flicker-free loading experience.
7. As an Administrator, I want the Consultation Frequency Report to share standard debounced loading indicators, so that report generation loading behavior matches the rest of the application.
8. As a Frontend Developer, I want pure date parsing utilities to be isolated from UI workflows, so that date calculations can be reused and tested in sub-millisecond unit tests.
9. As a Frontend Developer, I want debounced loading signal creation to be a shared reactive helper, so that new components do not re-implement RxJS timer and switchMap pipelines.
10. As a Frontend Developer, I want domain calculation engines to live in an engines directory, so that pure algorithmic math is clearly separated from stateful services and network I/O.
11. As a Frontend Developer, I want hexagonal ports and persistence adapters to live in a data access directory, so that gateway contracts and mock fixtures are organized together.
12. As a Frontend Developer, I want services to provide a root barrel export, so that restructuring directories does not break existing imports across the codebase.
13. As a Frontend Developer, I want the appointment intake workflow to delegate submission to a dedicated coordinator, so that the workflow class stays under 300 lines and focuses solely on stepper state.
14. As a Frontend Developer, I want appointment forms and error types to use canonical appointment terminology, so that the code reflects the canonical domain glossary.
15. As a Frontend Developer, I want backward-compatible aliases for booking terminology, so that existing component templates and tests continue to work without breaking changes.
16. As a Frontend Developer, I want the in-memory hospital adapter to remain unified, so that offline demo and test state stays synchronized across doctors, patients, and appointments without complex pub/sub events.
17. As a Frontend Developer, I want the in-memory adapter to use standard resource declarations, so that manual 20-line mock resource objects are eliminated.
18. As a Test Engineer, I want appointment submission and conflict recovery to be testable in isolation, so that I can verify retry and slot-reload logic without instantiating the full multi-step UI stepper.
19. As a Test Engineer, I want shared utilities to have dedicated zero-dependency unit tests, so that core date and reactive helpers are tested exhaustively.
20. As a Test Engineer, I want all existing component harness tests and engine tests to continue passing with zero regressions, so that system behavioral stability is guaranteed.

## Implementation Decisions

- **Shared Reactive & Date Utilities**:
  - Extract a standalone utility function `createDebouncedLoadingSignal` that accepts an `isLoading` signal and optional delay threshold, returning a debounced boolean signal.
  - Extract `parseIsoDate` into a standalone date utility module supporting ISO strings and Date instances with zeroed timestamps.
  - Refactor the Consultation Frequency Report and Doctor Earnings Report components to consume the shared loading utility, removing inlined RxJS pipes.
- **Services Directory Reorganization**:
  - Partition the services directory into two sub-packages:
    - `engines`: Standalone calculation engines (`time-slot-engine`, `doctor-earnings-engine`, `consultation-frequency-engine`) and their test suites.
    - `data-access`: Port contracts, capability interfaces, HTTP and in-memory adapters, and fixture data generators.
  - Retain application-wide session and runner services (`actor-session`, `operation-runner`) at the services root.
  - Maintain a services index barrel that re-exports all public symbols, preserving backward compatibility for existing imports.
- **Data Access Interface Segregation**:
  - Segregate the master data access port into four cohesive capability interfaces:
    - `SchedulingDataAccess`: Doctor retrieval, patient lookup, clerk lookup, time slot calculations, and appointment creation.
    - `ClinicalDataAccess`: Patient lookup, patient clinical history, medication catalog, and treatment recording.
    - `ReportingDataAccess`: Doctor earnings reports and Consultation Frequency Reports.
    - `SystemDataAccess`: Database status monitoring, database seeding, and database migration.
  - Maintain the master port interface as a composite type extending all four capability interfaces.
  - Introduce dedicated Angular injection tokens for each capability interface (`SCHEDULING_DATA_ACCESS`, `CLINICAL_DATA_ACCESS`, `REPORTING_DATA_ACCESS`, `SYSTEM_DATA_ACCESS`).
  - Provide a provider helper that registers the concrete adapter once under the master token and aliases each capability token to the master token using Angular's `useExisting`.
- **In-Memory Adapter Deepening & Cleanup**:
  - Preserve the in-memory hospital adapter as a unified singleton implementing the composite data access contract.
  - Simplify database status queries to return a standard resource whose loader returns undefined or an unresolving promise when loading simulation is active, deleting the custom 20-line fake resource object.
  - Streamline repeated resource declarations using a concise private query helper.
  - Define `AppointmentConflictError` as the canonical error class while exporting `BookingConflictError` as a backward-compatible alias.
- **Appointment Intake Workflow Decomposition**:
  - Extract `AppointmentSubmissionCoordinator` as an injectable service responsible for:
    - Validating required submission parameters.
    - Formatting the appointment creation request payload.
    - Executing the request through the operation runner.
    - Catching 409 conflict errors and invoking an `onConflict` recovery callback.
    - Resolving user-facing error messages.
  - Update `AppointmentIntakeWorkflow` to:
    - Inject `SCHEDULING_DATA_ACCESS` instead of the monolithic port.
    - Inject `AppointmentSubmissionCoordinator`.
    - Delegate its `submit()` method to the coordinator while retaining local signals for stepper progression, patient filtering, department filtering, and date selection.
    - Standardize property naming around `appointmentForm` and `appointmentNotes`, retaining `bookingForm` as a deprecated alias for template compatibility.

## Testing Decisions

- **Description of a Good Test**: Tests must verify observable behavior and state transitions across stable architectural seams rather than asserting internal private properties. UI flows are verified through Angular Material Component Harnesses, while utility and submission coordinators are tested through isolated unit tests.
- **Testing Seams**:
  - *Shared Utility Seam (Lowest Seam)*: Pure unit tests for date parsing and debounced loading signal creation, executing synchronously or with fake timers, with zero Angular TestBed or DOM dependencies.
  - *Submission Coordinator Seam*: Unit tests for `AppointmentSubmissionCoordinator` with a stubbed `SchedulingDataAccess` and `OperationRunner`, asserting successful appointment creation, 409 conflict handling, slot reload callback triggers, and error message resolution.
  - *Workflow State Seam*: Headless state transition tests for `AppointmentIntakeWorkflow`, verifying department filtering, doctor linked signal resets, time slot parameter derivations, and form validation.
  - *Component Harness Seam (Authoritative Highest Seam)*: End-to-end component interaction tests (`clerk-use-case.spec.ts`, `clerk-report.spec.ts`, `doctor-report.spec.ts`, `doctor-use-case.spec.ts`) using Angular Material harnesses against the DOM with `provideTestHospitalData()`.
  - *DI Aliasing Seam*: Contract verification tests asserting that injecting `SCHEDULING_DATA_ACCESS`, `CLINICAL_DATA_ACCESS`, `REPORTING_DATA_ACCESS`, and `SYSTEM_DATA_ACCESS` returns the exact same instance reference as the master port token.
- **Prior Art**:
  - Pure engine testing conventions established in `time-slot-engine.spec.ts` (ADR 0005).
  - Hexagonal DI provider testing in `hospital-data-access.spec.ts`.
  - Material CDK stepper and autocomplete harness patterns in `clerk-use-case.spec.ts` (ADR 0003).

## Out of Scope

- Splitting the in-memory hospital adapter into multiple isolated classes (rejected to prevent state synchronization issues and shallow forwarders).
- Introducing third-party state libraries such as NgRx SignalStore (rejected in favor of native Angular Signals, `linkedSignal`, and `@angular/forms/signals`).
- Changing backend REST endpoints or Flask server route implementations.
- Modifying UI layouts, Angular Material themes, or styling in the clerk intake stepper.
- Modifying pure calculation algorithms in `time-slot-engine`, `doctor-earnings-engine`, or `consultation-frequency-engine`.

## Further Notes

- This refactoring reduces `appointment-intake-workflow.ts` from ~430 lines to under ~280 lines and simplifies `in-memory-hospital-data-adapter.ts` by ~80 lines.
- The Interface Segregation implementation satisfies all requirements from `.scratch/data-access-interface-segregation/spec.md`.
- Following implementation, an Architecture Decision Record (`docs/adr/0006-data-access-interface-segregation-and-workflow-decomposition.md`) should be created to document the design decisions and trade-offs.
