# 03: Implement Deterministic InMemoryHospitalDataAdapter for Test Suites

**What to build:** Implement `InMemoryHospitalDataAdapter` as an injectable service fulfilling the `HospitalDataAccess` port contract. The in-memory adapter maintains deterministic collections of Patients, Doctors, Clerks, Appointments, and Medications. Reactive query methods simulate `ResourceRef` behavior using signals or Angular's `resource` primitive. Synchronous mutation methods (`bookAppointment`, `addTreatment`) update internal state, maintain consistency across subsequent queries, and detect conflicts (such as overlapping bookings for the same doctor and time slot) by throwing `BookingConflictError`.

**Blocked by:** 01: Define HospitalDataAccess Port, Token, and Domain Error Hierarchy

**Status:** resolved

## Acceptance Criteria

- [x] `InMemoryHospitalDataAdapter` implements `HospitalDataAccess` and is marked `@Injectable()`.
- [x] Seeded with deterministic test data for Doctors, Patients, Clerks, Appointments, and Medications conforming to `GLOSSARY.md`.
- [x] `searchPatients` and `searchClerks` filter by query string (case-insensitive substring match on name and SSN).
- [x] `getDoctors`, `getMedications`, and `getPatientDetails` return unwrapped domain entities.
- [x] `getTimeSlots` computes 30-minute slots between 08:00 and 17:00, marking booked slots unavailable based on in-memory appointments.
- [x] `bookAppointment` detects slot conflicts and persists new appointments, returning `CreateAppointmentResponse`.
- [x] `addTreatment` adds treatments to the designated patient appointment.
- [x] `getDoctorEarningsReport` and `getPatientVisitsReport` dynamically aggregate metrics from in-memory records.
- [x] Unit tests verify synchronous mutations, slot conflict detection, search filtering, and report generation without any HTTP dependencies.

## Comments

- Implemented `InMemoryHospitalDataAdapter` in `src/app/services/in-memory-hospital-data-adapter.ts`.
- Seeded with deterministic domain entities adhering to `GLOSSARY.md` (Doctors, Patients with treatments and NACA scores, Clerks, Medications, Appointments).
- Implemented reactive queries via Angular v22 `resource()` with reactive `stateVersion` tracking for automatic query invalidation and update upon mutations.
- Enforced appointment slot conflict detection and accurate aggregation for earnings and patient visit reports.
- Added comprehensive unit tests in `src/app/services/in-memory-hospital-data-adapter.spec.ts` covering 12 scenarios with zero HTTP mock dependencies. All tests pass cleanly.
