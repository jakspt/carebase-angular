# Frontend Architecture Deepening

Status: ready-for-agent

## Problem Statement

As the CareBase frontend evolved through feature additions, testing migrations, and hexagonal data access integration, several layers of architectural friction and shallowness emerged across the Angular codebase:

1. **Shallow Pass-Through Modules**:
   `DoctorService` is completely unused across the application (zero consumer imports), acting as dead code. `ClerkService` is an empty one-line forwarding facade that simply re-exposes methods from the `HospitalDataAccess` seam and `ActorSession`. Maintaining these shallow modules introduces cognitive overhead, extra files to navigate, and duplicate test suites without providing business logic, validation invariants, or test leverage.

2. **Artificial Seam in Appointment Intake**:
   The appointment booking workflow was historically split into a headless workflow class and a Material stepper view component. To bridge the two, the view component manually re-declares 28 pass-through signal accessors and 10 forwarding methods. Furthermore, this split forces the maintenance of two redundant test suites totaling over 1,430 lines of code: one headless suite asserting internal signal states, and one component suite exercising the exact same user flow through Material harnesses. This introduces severe shotgun surgery friction whenever appointment intake requirements change.

3. **Rogue Administrative Transport Bypass**:
   While clinical features were standardized on the hexagonal `HospitalDataAccess` seam with an in-memory test adapter (ADR-0003), administrative operations (database status polling, database seeding, and MongoDB migration) were implemented as an unseamed HTTP service. This bypass forced the creation of an ad-hoc test mock (`provideTestAdminService`) with simulated signal properties, breaking testing uniformity and preventing end-to-end simulation of database state transitions.

4. **Test Backdoor Leakage in Reports**:
   The Consultation Frequency Report component exposes an internal mutable test signal (`reportDataSignal`) on its public class interface specifically to bypass async data fetching during unit testing. Furthermore, KPI aggregations (unique patients, active doctors, total consultations) and chart data transformations are entangled with template rendering rather than encapsulated behind a clean analytical query interface.

5. **Technical Role Naming vs. Domain Intent**:
   Key feature directories encode technical architecture patterns (`clerk-use-case`, `doctor-use-case`) rather than the ubiquitous hospital domain vocabulary established in `GLOSSARY.md` and recommended by the modern Angular v20+ style guide ("Intent over Role").

## Solution

Deepen the frontend codebase architecture by eliminating shallow modules, consolidating split workflows, bringing administrative persistence under the hexagonal seam, and aligning domain terminology:

1. **Delete Shallow Pass-Through Services**:
   Remove `DoctorService` and `ClerkService`. Direct all feature components and workflows to consume the `HospitalDataAccess` injection token and `ActorSession` directly.

2. **Consolidate Appointment Intake Module**:
   Collapse the headless appointment workflow and stepper view into a single deep Appointment Intake module. Replace manual property-forwarding signals with direct reactive derivations, leverage modern Angular `linkedSignal` for cascading step resets (e.g., resetting selected Doctor when Department changes), and integrate directly with Angular v22 Signal Forms. Standardize testing exclusively on user-facing Material CDK harnesses (`MatStepperHarness`, `MatAutocompleteHarness`, `MatButtonHarness`).

3. **Absorb Administrative Operations into Hospital Data Access**:
   Extend the `HospitalDataAccess` port to include database status inspection, database seeding, and database migration. Update `HttpHospitalDataAdapter` to communicate with the administration backend endpoints, and update `InMemoryHospitalDataAdapter` to maintain a reactive database persistence state (`MariaDB` vs. `MongoDB`). Delete `AdminService` and its ad-hoc `provideTestAdminService` stub.

4. **Deepen Consultation Frequency Report & Cleanse Test Surface**:
   Remove the `reportDataSignal` test backdoor from the Consultation Frequency Report component. Encapsulate KPI computations and chart aggregations in pure domain calculation functions that can be tested in isolation with zero Angular TestBed overhead. Share common reactive utilities (such as debounced resource loading indicators) across report modules.

5. **Align Feature Naming with Domain Intent**:
   Rename technical role directories and classes to match domain concepts defined in `GLOSSARY.md` (`clerk-use-case` $\rightarrow$ `appointment-intake`, `doctor-use-case` $\rightarrow$ `treatment-recording`, `clerk-report` $\rightarrow$ `consultation-frequency-report`, `doctor-report` $\rightarrow$ `doctor-earnings-report`).

## User Stories

1. As a Clerk, I want appointment intake to reliably reset downstream selections (Doctor, Time Slot) when upstream criteria (Department, Date) change, so that I never schedule an Appointment with invalid or mismatched parameters.
2. As a Clerk, I want appointment intake form submission to interact seamlessly with the Operation Runner, so that duplicate bookings are locked out while the booking request is in flight.
3. As a Clerk, I want scheduling collisions (HTTP 409) during appointment booking to clearly signal that the Time Slot is occupied, so that I can prompt the patient to choose an alternate time window.
4. As a Clerk, I want the Consultation Frequency Report to accurately calculate unique Patients, active Doctors, and total consultation counts across selected date ranges, so that administrative oversight is dependable.
5. As a Doctor, I want patient search, appointment selection, and clinical treatment recording to behave cohesively without intermediate forwarding layers, so that clinical documentation is swift and responsive.
6. As a Doctor, I want Doctor Earnings reports to clearly chart annual treatment costs across departments, so that financial analytics reflect true persisted treatment values.
7. As an Administrator, I want database status, seeding, and migration operations to execute through the unified hospital data seam, so that persistence management behaves identically across production and test environments.
8. As an Administrator, I want database migration to MongoDB to immediately reflect in the application header status indicator, so that current operational persistence mode is universally visible.
9. As an Administrator, I want database seeding to populate sample hospital entities without corrupting active MongoDB settings, strictly upholding ADR-0001 invariants.
10. As a Frontend Maintainer, I want `DoctorService` deleted, so that zero dead code remains in the services directory.
11. As a Frontend Maintainer, I want `ClerkService` deleted, so that feature callers exercise the `HospitalDataAccess` seam directly without 1-to-1 delegation layers.
12. As a Frontend Maintainer, I want the 28 mirrored signal properties in the Appointment Intake component eliminated, so that adding or modifying an intake field does not require editing two separate classes.
13. As a Frontend Maintainer, I want appointment intake state transitions orchestrated using `linkedSignal`, so that state resets are declarative rather than imperatively invoked across event handlers.
14. As a Frontend Maintainer, I want administrative actions covered by `InMemoryHospitalDataAdapter`, so that testing admin features uses the canonical `provideTestHospitalData()` instead of custom mock objects.
15. As a Frontend Maintainer, I want `provideTestAdminService` eliminated, so that the frontend codebase maintains exactly one data access mock strategy.
16. As a Frontend Maintainer, I want the mutable `reportDataSignal` backdoor removed from the Consultation Frequency Report, so that tests verify real observable component behavior through standard harnesses.
17. As a Frontend Maintainer, I want report KPI and chart aggregations written as pure calculation functions, so that analytical logic can be tested with fast unit tests without bootstrapping Angular TestBed.
18. As a Frontend Maintainer, I want shared reactive utilities (debounced loading indicators) consolidated, so that multiple report pages do not duplicate identical RxJS pipeline definitions.
19. As a Frontend Maintainer, I want feature folders named after domain concepts (`appointment-intake`, `treatment-recording`) rather than technical archetypes (`clerk-use-case`), so that code navigation matches the domain glossary.
20. As an Automated Testing Agent, I want all tests across the frontend to execute cleanly via `ng test --watch=false` without manual change detection or collaborator method spying, in full compliance with ADR-0003.

## Implementation Decisions

1. **Elimination of Shallow Service Facades**:
   - Delete `DoctorService` and its file.
   - Delete `ClerkService` and its unit test suite (`clerk-service.spec.ts`).
   - Consumers (`AppointmentIntake`, `ActorSession` callers) inject `HOSPITAL_DATA_ACCESS` and `ActorSession` directly.

2. **Consolidation of the Appointment Intake Module**:
   - Merge `AppointmentIntakeWorkflow` logic into `AppointmentIntake` component.
   - Use `linkedSignal` for dependent wizard step selections:
     ```ts
     // Prototype linked signal shape for dependent step state
     readonly selectedDoctor = linkedSignal<string | null, Doctor | null>({
       source: this.selectedDepartment,
       computation: () => null,
     });

     readonly selectedTimeSlot = linkedSignal<{ doctor: Doctor | null; date: string }, TimeSlot | null>({
       source: () => ({ doctor: this.selectedDoctor(), date: this.selectedDate() }),
       computation: () => null,
     });
     ```
   - Bind Signal Forms directly to the component model without intermediate event bridges.
   - Retire the headless `appointment-intake-workflow.spec.ts` suite; rely on `clerk-use-case.spec.ts` (renamed to `appointment-intake.spec.ts`) using Material Stepper and Autocomplete harnesses.

3. **Hexagonal Seam Expansion for Admin Operations**:
   - Add database operations to `HospitalDataAccess` port:
     ```ts
     export interface HospitalDataAccess {
       // ... existing methods ...
       getDatabaseStatus(): ResourceRef<DbStatus | undefined>;
       seedDatabase(): Promise<{ success: boolean; message: string }>;
       migrateDatabase(): Promise<{ success: boolean; message: string }>;
     }
     ```
   - Implement `getDatabaseStatus()` via `httpResource<DbStatus>(() => '/api/status')` in `HttpHospitalDataAdapter`.
   - Implement reactive database status signal (`signal<'MariaDB' | 'MongoDB'>('MariaDB')`) in `InMemoryHospitalDataAdapter`, updated upon calling `migrateDatabase()`.
   - Update `AdminPage` and `HeaderLayout` to inject `HOSPITAL_DATA_ACCESS`.
   - Delete `AdminService` and `provideTestAdminService`.

4. **Consultation Frequency Report Deepening & Seam Cleansing**:
   - Remove `reportDataSignal` from the component.
   - Extract pure domain aggregation functions:
     - `computeConsultationKpis(records: PatientVisitRecord[]): ConsultationKpis`
     - `computeDoctorConsultationChart(records: PatientVisitRecord[]): ChartDataItem[]`
   - Test these functions with pure Vitest unit specs.
   - Extract `createDebouncedLoadingSignal(isLoading: Signal<boolean>, delayMs?: number): Signal<boolean>` into a shared reactive utility.

5. **Domain Feature Naming Migration**:
   - Rename directories:
     - `src/app/clerk-use-case/` $\rightarrow$ `src/app/appointment-intake/`
     - `src/app/doctor-use-case/` $\rightarrow$ `src/app/treatment-recording/`
     - `src/app/clerk-report/` $\rightarrow$ `src/app/consultation-frequency-report/`
     - `src/app/doctor-report/` $\rightarrow$ `src/app/doctor-earnings-report/`
   - Update class names and template selectors accordingly.
   - Update router route definitions in `app.routes.ts`.

## Testing Decisions

1. **Testing at the Highest Seam**:
   - Feature workflows must be tested exclusively through Angular CDK and Material Component Harnesses (`TestbedHarnessEnvironment`, `MatStepperHarness`, `MatAutocompleteHarness`, `MatButtonHarness`, `MatTableHarness`).
   - Prohibit testing internal signal implementations or private workflow fields.

2. **Single Hexagonal Mock Seam**:
   - All tests interacting with hospital data or database administrative actions must inject `provideTestHospitalData()`.
   - Prohibit ad-hoc service stubbing or `HttpClientTestingModule` in feature test suites.

3. **Deterministic Autocomplete & Async Stabilization**:
   - All autocomplete interactions must follow the canonical polling stabilization pattern defined in ADR-0003 (`vi.waitFor` verifying panel open state and resource population before option selection).
   - Use `await fixture.whenStable()` exclusively; no manual `fixture.detectChanges()` or timer sleep workarounds.

4. **Prior Art in the Codebase**:
   - Existing component harness tests in `src/app/clerk-use-case/clerk-use-case.spec.ts` and `src/app/action-card/action-card.spec.ts`.
   - In-memory adapter patterns in `src/app/services/in-memory-hospital-data-adapter.spec.ts`.

## Out of Scope

1. Backend Flask/Python persistence layer changes (endpoints `/api/*` remain unchanged).
2. MariaDB or MongoDB database schema modifications.
3. Visual UI styling redesigns or altering Material design themes.
4. Altering the core contracts of `OperationRunner` or `ActorSession`.

## Further Notes

- Implementations should proceed incrementally in order of dependency:
  1. Ticket 01: Eliminate shallow pass-through services (`DoctorService`, `ClerkService`).
  2. Ticket 02: Absorb admin operations into `HospitalDataAccess` and retire `AdminService`.
  3. Ticket 03: Deepen Consultation Frequency Report and purge test backdoor signals.
  4. Ticket 04: Consolidate Appointment Intake workflow and adopt `linkedSignal`.
  5. Ticket 05: Modernize domain directory naming and route definitions.
