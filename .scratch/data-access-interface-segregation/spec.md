Status: ready-for-agent

# Spec: Frontend Data Access Interface Segregation

## Problem Statement

The CareBase frontend mediates all backend persistence and in-memory mock queries through a single, monolithic hexagonal port interface (`HospitalDataAccess`). While this single-token design makes swapping between HTTP and in-memory adapters straightforward, it violates the Interface Segregation Principle (ISP):

1. **Unnecessary Exposure & High Coupling**: Feature modules are forced to depend on methods they never use. For example, administrative views (`AdminPage`) only require database status, seeding, and migration capabilities, yet their injected dependency exposes clinical treatment and appointment scheduling APIs. Similarly, clinical components (`DoctorUseCase`) have direct access to database migrations and scheduling workflows in their IDE autocomplete.
2. **Cognitive Load & Developer Ergonomics**: Developers working on a specific domain (such as clinical treatments or appointment intake) face a noisy autocomplete menu containing 13 methods spanning completely unrelated hospital domains.
3. **Test Double Overheads**: When authoring isolated test doubles or stubs for a specific domain flow, developers must either stub all 13 methods of the monolithic port or resort to unsafe type assertions (`as unknown as HospitalDataAccess`).
4. **Risk of Indirection Bloat**: Naively splitting the adapter into separate classes would reintroduce the shallow forwarder anti-pattern previously purged in ADR 0005 and fragment the shared reactive in-memory state required for seamless offline demos and testing.

## Solution

Refactor the frontend data access architecture to implement the Interface Segregation Principle using TypeScript interface composition and Angular dependency injection aliasing (`useExisting`):

1. Decompose the monolithic data access contract into four cohesive capability interfaces:
   - **Scheduling Data Access**: doctors, patient lookup, clerk lookup, 30-minute Time Slots, and appointment creation.
   - **Clinical Data Access**: patient lookup, patient clinical details, medication catalogs, and treatment recording.
   - **Reporting Data Access**: Doctor earnings reports and Consultation Frequency Reports.
   - **System Data Access**: database connectivity status, database seeding, and database migration.
2. Maintain the unified hexagonal port interface as a composite type extending all four capability interfaces, ensuring 100% backward compatibility.
3. Define individual injection tokens for each capability slice alongside the unified port token.
4. Provide a unified provider configuration helper that binds the concrete adapter class once to the unified port token, and aliases each capability token to that master token using Angular's `useExisting`.
5. Update feature consumers (`DoctorUseCase`, `DoctorReport`, `AppointmentIntakeWorkflow`, `ClerkReport`, `AdminPage`, `HeaderLayout`) to inject only their required capability tokens.

## User Stories

1. As a Clerk, I want appointment scheduling workflows to depend only on scheduling data operations, so that unrelated clinical or database maintenance operations cannot accidentally be invoked.
2. As a Clerk, I want patient search during appointment intake to remain fast and conflict-free, so that scheduling 30-minute Time Slots remains responsive.
3. As a Clerk, I want the administrative Consultation Frequency Report to depend only on reporting data access, so that report views cannot trigger appointment booking or patient mutations.
4. As a Doctor, I want clinical treatment workflows to depend strictly on clinical data operations, so that database maintenance and intake scheduling logic are inaccessible from clinical views.
5. As a Doctor, I want medication catalogs and patient history to load through a dedicated clinical interface, so that medical intervention recording has clear contractual boundaries.
6. As a Doctor, I want annual earnings reporting to depend strictly on reporting data access, so that financial analytics cannot alter clinical treatments or patient records.
7. As a System Administrator, I want the database management view to depend exclusively on system data access, so that administrative operations cannot view or alter clinical patient data or appointments.
8. As a System Administrator, I want database status monitoring in the application header to depend only on system data access, so that global layouts do not take dependencies on clinical workflows.
9. As a Frontend Developer, I want IDE autocomplete in domain feature components to show only methods relevant to that component's domain capability, so that cognitive load is minimized.
10. As a Frontend Developer, I want to swap between the HTTP backend adapter and the in-memory adapter at a single configuration point, so that static and live application environments require zero multi-token boilerplate.
11. As a Frontend Developer, I want in-memory state mutations performed during scheduling to be immediately visible to clinical queries in offline mode, so that shared in-memory test fixtures stay in sync without complex pub/sub buses.
12. As a Frontend Developer, I want the unified port interface to extend all four capability interfaces, so that existing code referencing the master token continues to work without breaking changes.
13. As a Frontend Developer, I want segregated tokens to alias to the primary adapter instance via Angular's `useExisting`, so that no redundant adapter instances or shallow forwarder classes are created.
14. As a Test Engineer, I want unit tests for specific domain components to provide lightweight stubs for only the relevant capability token, so that test setups do not require mocking 13 unrelated port methods.
15. As a Test Engineer, I want existing Angular Material CDK harness test suites using `provideTestHospitalData()` to pass without modification, so that component behavioral verification remains stable and authoritative.

## Implementation Decisions

- **Capability Decomposition**: Segregate the monolithic port into four capability contracts:
  - `SchedulingDataAccess`: `getDoctors`, `searchPatients`, `searchClerks`, `getTimeSlots`, `bookAppointment`
  - `ClinicalDataAccess`: `searchPatients`, `getPatientDetails`, `getMedications`, `addTreatment`
  - `ReportingDataAccess`: `getDoctorEarningsReport`, `getConsultationFrequencyReport` (with backwards-compatible `getPatientVisitsReport?`)
  - `SystemDataAccess`: `getDatabaseStatus`, `seedDatabase`, `migrateDatabase`
- **Composite Hexagonal Port**: The existing port interface extends all four capability interfaces:
  ```typescript
  export interface HospitalDataAccess
    extends SchedulingDataAccess,
      ClinicalDataAccess,
      ReportingDataAccess,
      SystemDataAccess {}
  ```
  The existing HTTP and In-Memory adapter classes continue to implement the composite interface directly. No wrapper classes or proxy classes are introduced.
- **Dependency Injection Aliasing**:
  - Introduce dedicated injection tokens for each capability: `SCHEDULING_DATA_ACCESS`, `CLINICAL_DATA_ACCESS`, `REPORTING_DATA_ACCESS`, and `SYSTEM_DATA_ACCESS`.
  - A shared helper function configures the single adapter class with `useClass` for the master token, and aliases all capability tokens to the master token using `useExisting`.
  - Production configuration, static demo configuration, and test harnesses utilize this helper, preserving a single seam for swapping persistence modes.
- **Consumer Injection Updates**:
  - `AppointmentIntakeWorkflow`: injects `SCHEDULING_DATA_ACCESS`
  - `ClerkReport`: injects `REPORTING_DATA_ACCESS`
  - `DoctorUseCase`: injects `CLINICAL_DATA_ACCESS`
  - `DoctorReport`: injects `REPORTING_DATA_ACCESS`
  - `AdminPage`: injects `SYSTEM_DATA_ACCESS`
  - `HeaderLayout`: injects `SYSTEM_DATA_ACCESS`
- **Zero-Forwarder Discipline**: In compliance with ADR 0005, no intermediate proxy or facade services are created. Components inject their segregated capability tokens directly.

## Testing Decisions

- **Description of a Good Test**: Tests must verify observable behavior across stable seams rather than private implementation details. Component tests verify user journeys through Angular Material harnesses, while port tests verify contract fulfillment and reactive resource updates.
- **Testing Seams**:
  - *Primary Component Seam (Highest Seam)*: Authoritative end-to-end component behavioral tests (`clerk-use-case.spec.ts`, `doctor-use-case.spec.ts`, `clerk-report.spec.ts`, `doctor-report.spec.ts`, `admin-page.spec.ts`, `header-layout.spec.ts`) continue testing against Angular Material CDK harnesses using `provideTestHospitalData()`.
  - *DI Aliasing Seam*: A focused test suite in the data access port spec verifies that injecting each capability token (`SCHEDULING_DATA_ACCESS`, `CLINICAL_DATA_ACCESS`, `REPORTING_DATA_ACCESS`, `SYSTEM_DATA_ACCESS`) returns the exact same object reference (`toBe`) as `HOSPITAL_DATA_ACCESS`.
  - *Pure Domain Engine Seam*: Engine tests (`time-slot-engine.spec.ts`, `doctor-earnings-engine.spec.ts`, `consultation-frequency-engine.spec.ts`) remain untouched and execute with zero Angular dependencies.
- **Prior Art**:
  - Hexagonal testing standards and DI token testing in `frontend/carebase-frontend/src/app/services/hospital-data-access.spec.ts`.
  - Component testing harness conventions in `docs/adr/0003-frontend-testing-standards-and-harnesses.md` and `docs/adr/0005-frontend-deepening-and-seam-simplification.md`.

## Out of Scope

- Physically splitting `InMemoryHospitalDataAdapter` or `HttpHospitalDataAdapter` into multiple separate classes.
- Changing backend REST endpoints or Flask server route structures.
- Altering the user interface, styling, or stepper flows of the frontend application.
- Redesigning pure domain engines (`time-slot-engine`, `doctor-earnings-engine`, `consultation-frequency-engine`).

## Further Notes

- This refactoring brings strict adherence to the Interface Segregation Principle (ISP) while strictly honoring ADR 0005's rejection of shallow forwarder services.
- All 327+ existing Vitest unit and harness tests must continue to pass with zero regressions.
