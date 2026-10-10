# Hospital Data Access Seam and Two-Adapter Architecture

Status: ready-for-agent

## Problem Statement

Clinical workflows across the hospital information system—such as Clerk appointment scheduling and Doctor patient care—rely heavily on querying and mutating clinical entities. However, data access across the frontend is currently fragmented and leaks transport-level HTTP mechanics directly into UI components and feature services.

Feature modules currently invoke raw `httpResource` endpoints whose responses contain nested backend data transfer envelopes (such as `{ doctors: Doctor[] }`, `{ patients: Patient[] }`, `{ medications: Medication[] }`, or `{ clerks: Clerk[] }`). Callers must manually unwrap these envelopes and handle defensive null-checks. In addition, calls to `httpResource` initiated outside component construction must pass manual `Injector` references, creating fragile dependency injection plumbing. Furthermore, network errors and HTTP status codes bubble up directly into feature components rather than being represented as meaningful domain errors.

Most critically, this lack of an architectural seam severely damages testing. Feature components and workflow tests cannot test data interactions without configuring Angular's HTTP testing controller (`provideHttpClientTesting`, `HttpTestingController`), intercepting raw URLs, asserting query parameter strings, and simulating low-level transport responses. This couples unit and workflow tests directly to network transport details rather than external domain behavior, making tests brittle upon transport refactoring and slowing down test suite execution.

## Solution

Introduce a clean **Two-Adapter Seam** for hospital data access governed by an Angular `InjectionToken` port.

The port defines a domain-oriented contract for all clinical queries and commands (retrieving Doctors, searching Patients, fetching Medications, querying Time Slots, generating reports, booking Appointments, and recording Treatments) that exposes clean, unwrapped domain models.

Two first-class adapters implement this port:
1. **Production HTTP Adapter**: Implements the port using Angular v22's `httpResource` configured with the declarative `parse` transformation option. The `parse` function unwraps backend envelopes (transforming `{ doctors: Doctor[] }` into `Doctor[]` and `{ medications: Medication[] }` into `Medication[]`) and maps HTTP communication failures into clean domain errors at the network boundary, while internalizing query string serialization and injection context management.
2. **In-Memory Test Adapter**: Implements the identical port contract backed entirely by an in-memory datastore seeded with deterministic Patients, Doctors, Clerks, Appointments, and Medications.

Because exactly two adapters fulfill the same port, the seam is fully justified: the production application communicates with backend HTTP services, while unit, integration, and UI workflow tests run completely against the in-memory adapter—eliminating HTTP mocking boilerplate, preventing network leakage into feature logic, and making test suites fast and resilient to transport changes.

## User Stories

1. As a Clerk, I want to retrieve the complete list of hospital Doctors without handling response envelopes, so that I can schedule Appointments with attending medical staff.
2. As a Clerk, I want to search for Patients by name or Social Security Number (SSN) and receive clean Patient records immediately, so that I can schedule Appointments without delay.
3. As a Clerk, I want available 30-minute Time Slots to load transparently for a selected Doctor and date, so that I can book conflict-free consultations.
4. As a Clerk, I want to book an Appointment through a reliable data access layer, so that patient reservations are guaranteed without transport-induced failures.
5. As a Clerk, I want to generate a Patient visits summary report over a specified date range, so that hospital attendance and capacity can be monitored.
6. As a Doctor, I want to search for Patients by name or SSN and receive unwrapped Patient entities, so that I can review medical records quickly.
7. As a Doctor, I want to retrieve comprehensive Patient details including historical Appointments and Treatments, so that I have the complete clinical history before an intervention.
8. As a Doctor, I want to retrieve the full formulary of hospital Medications without dealing with wrapped transport payloads, so that I can prescribe appropriate treatments.
9. As a Doctor, I want to record Treatments and prescribed Medications for an Appointment through a type-safe data access interface, so that clinical procedures and costs are accurately preserved.
10. As a Doctor, I want to query the Doctor Earnings Report for any selected year and receive structured yearly earning figures, so that financial compensation is clearly visible.
11. As a Frontend Maintainer, I want all hospital data interactions abstracted behind a single `InjectionToken` port, so that clinical feature modules depend on domain contracts rather than HTTP clients.
12. As a Frontend Maintainer, I want backend response envelopes (`{ doctors: Doctor[] }`, `{ patients: Patient[] }`, `{ medications: Medication[] }`) unwrapped at the adapter boundary using `httpResource`'s `parse` option, so that components and workflows consume clean domain models directly.
13. As a Frontend Maintainer, I want query parameter serialization and URL encoding centralized within the HTTP adapter, so that call sites do not duplicate URL formatting logic.
14. As a Frontend Maintainer, I want an in-memory test adapter that fulfills the hospital data access port, so that feature module tests can execute synchronously without mocking HTTP requests.
15. As a Frontend Maintainer, I want to eliminate `HttpTestingController` and URL matching from component and workflow tests, so that tests only verify external business behavior.
16. As a Frontend Maintainer, I want network failures translated into discrete domain errors at the adapter boundary, so that UI components do not handle raw HTTP status codes.
17. As an Automated Test Suite, I want to run tests against fast in-memory adapters, so that test execution is near-instantaneous and deterministic.

## Implementation Decisions

1. **Port Interface and Dependency Injection Token**:
   - Define a unified `HospitalDataAccess` interface exposed via an `InjectionToken<HospitalDataAccess>`.
   - The contract defines reactive queries (returning Angular `ResourceRef` with unwrapped models) and mutative commands (returning Promises or Observables).
   - Inlined snippet from architectural prototype:

     ```ts
     export interface HospitalDataAccess {
       getDoctors(): ResourceRef<Doctor[]>;
       searchPatients(query: Signal<string>): ResourceRef<Patient[]>;
       getPatientDetails(patientId: Signal<string | number | null>): ResourceRef<Patient | null>;
       searchClerks(query: Signal<string>): ResourceRef<Clerk[]>;
       getTimeSlots(params: Signal<TimeSlotQueryParams | undefined>): ResourceRef<TimeSlotsResult>;
       getMedications(): ResourceRef<Medication[]>;
       getDoctorEarningsReport(year: Signal<number>): ResourceRef<DoctorEarningsReport>;
       getPatientVisitsReport(dateRange: Signal<DateRange | undefined>): ResourceRef<PatientVisitsReport>;
       bookAppointment(payload: CreateAppointmentRequest): Promise<CreateAppointmentResponse>;
       addTreatment(patientId: string | number, appointmentId: number, treatment: Treatment): Promise<AddTreatmentResponse>;
     }
     ```

2. **Production HTTP Adapter with `httpResource` and `parse`**:
   - Implement `HospitalDataAccess` in a production adapter that delegates to Angular v22's `httpResource`.
   - Use the declarative `parse` option to unwrap backend response envelopes (`{ doctors: Doctor[] }` -> `Doctor[]`) at the boundary.
   - Centralize URL construction and query parameter formatting within the adapter.
   - Encapsulate the injection context internally, eliminating the need for callers to pass `{ injector: this.injector }`.
   - Translate HTTP error responses into structured domain errors.

3. **In-Memory Test Adapter**:
   - Implement `HospitalDataAccess` in an in-memory test adapter backed by in-memory collections of Patients, Doctors, Clerks, Appointments, and Medications.
   - Reactive queries simulate `ResourceRef` behavior using signals.
   - Mutative methods synchronously update in-memory state and simulate domain errors (e.g., duplicate booking conflicts) when configured.

4. **Provider Binding Strategy**:
   - In application environment providers (`app.config.ts`), bind `HOSPITAL_DATA_ACCESS` to the production HTTP adapter.
   - In test fixtures, bind `HOSPITAL_DATA_ACCESS` to the in-memory test adapter via `providers: [{ provide: HOSPITAL_DATA_ACCESS, useClass: InMemoryHospitalDataAdapter }]`.

## Testing Decisions

1. **Test External Behavior, Not Implementation Details**:
   - Tests verify that calling query methods returns expected domain models and calling mutative commands persists changes or yields expected domain errors.
   - Tests do not assert on internal signal graph details or private adapter variables.

2. **Modules to Test**:
   - **Production HTTP Adapter Tests**: Verify that the HTTP adapter correctly formats query URLs, sets HTTP methods, unwraps envelopes using `parse`, and translates HTTP error codes into domain errors using `provideHttpClientTesting()`.
   - **In-Memory Test Adapter Tests**: Verify that search filtering, slot availability checks, appointment booking, and treatment additions accurately mutate and query in-memory state.
   - **Consumer Feature Tests**: Clerk and Doctor feature modules will be tested against the in-memory adapter without `HttpTestingController` or URL mocking.

3. **Prior Art in the Codebase**:
   - Follow existing unit testing patterns established in the project using Vitest, zoneless testing principles, and `await fixture.whenStable()`.

## Out of Scope

- **Backend Endpoints and Persisted Contracts**: No alterations to backend `/api/clerk/*` or `/api/doctor/*` endpoints or server-side SQL/MongoDB database schemas.
- **UI Presentation and Layout**: Visual layouts, styles, and Angular Material component bindings remain unchanged.
- **Appointment Intake Internal State Machine**: Refactoring the intake state machine is managed under the separate appointment intake specification.

## Further Notes

- This refactoring fulfills Candidate 2 ("Establish a Two-Adapter Seam for Hospital Data Access") from the codebase architectural review.
- The terminology in this specification strictly conforms to the canonical domain definitions in `GLOSSARY.md` (Doctor, Clerk, Patient, Department, Appointment, Time Slot, Treatment, Medication, SSN, NACA Score).
