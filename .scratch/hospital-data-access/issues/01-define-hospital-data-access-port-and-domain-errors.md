# 01: Define HospitalDataAccess Port, Token, and Domain Error Hierarchy

**What to build:** Define the canonical `HospitalDataAccess` interface and its Angular dependency injection token `HOSPITAL_DATA_ACCESS`. Define domain models and types for clinical queries and commands: `TimeSlotQueryParams`, `TimeSlotsResult`, `DoctorEarningsReport`, `PatientVisitsReport`, `DateRange`, and `AddTreatmentResponse`. Establish an explicit domain error hierarchy (`HospitalDataError`, `BookingConflictError`, `PatientNotFoundError`) so network and business failures are modeled cleanly at the architectural boundary.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

## Acceptance Criteria

- [ ] `HospitalDataAccess` interface is declared in `src/app/services/hospital-data-access.ts` with reactive query methods returning `ResourceRef` and mutative command methods returning `Promise`.
- [ ] `HOSPITAL_DATA_ACCESS` is exported as an `InjectionToken<HospitalDataAccess>('HOSPITAL_DATA_ACCESS')`.
- [ ] Domain models and supporting query types (`TimeSlotQueryParams`, `TimeSlotsResult`, `DoctorEarningsReport`, `PatientVisitsReport`, `DateRange`, `AddTreatmentResponse`) are exported and aligned with `models.ts` and `GLOSSARY.md`.
- [ ] Domain error classes (`HospitalDataError`, `BookingConflictError`, `PatientNotFoundError`) are defined and exported.
- [ ] Unit tests verify token creation, error prototype inheritance, and type integrity.
