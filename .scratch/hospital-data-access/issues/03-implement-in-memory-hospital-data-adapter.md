# 03: Implement Deterministic InMemoryHospitalDataAdapter for Test Suites

**What to build:** Implement `InMemoryHospitalDataAdapter` as an injectable service fulfilling the `HospitalDataAccess` port contract. The in-memory adapter maintains deterministic collections of Patients, Doctors, Clerks, Appointments, and Medications. Reactive query methods simulate `ResourceRef` behavior using signals or Angular's `resource` primitive. Synchronous mutation methods (`bookAppointment`, `addTreatment`) update internal state, maintain consistency across subsequent queries, and detect conflicts (such as overlapping bookings for the same doctor and time slot) by throwing `BookingConflictError`.

**Blocked by:** 01: Define HospitalDataAccess Port, Token, and Domain Error Hierarchy

**Status:** ready-for-agent

## Acceptance Criteria

- [ ] `InMemoryHospitalDataAdapter` implements `HospitalDataAccess` and is marked `@Injectable()`.
- [ ] Seeded with deterministic test data for Doctors, Patients, Clerks, Appointments, and Medications conforming to `GLOSSARY.md`.
- [ ] `searchPatients` and `searchClerks` filter by query string (case-insensitive substring match on name and SSN).
- [ ] `getDoctors`, `getMedications`, and `getPatientDetails` return unwrapped domain entities.
- [ ] `getTimeSlots` computes 30-minute slots between 08:00 and 17:00, marking booked slots unavailable based on in-memory appointments.
- [ ] `bookAppointment` detects slot conflicts and persists new appointments, returning `CreateAppointmentResponse`.
- [ ] `addTreatment` adds treatments to the designated patient appointment.
- [ ] `getDoctorEarningsReport` and `getPatientVisitsReport` dynamically aggregate metrics from in-memory records.
- [ ] Unit tests verify synchronous mutations, slot conflict detection, search filtering, and report generation without any HTTP dependencies.
