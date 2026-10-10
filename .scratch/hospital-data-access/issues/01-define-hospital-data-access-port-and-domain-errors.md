# 01: Define HospitalDataAccess Port, Token, and Domain Error Hierarchy

**What to build:** Define the canonical `HospitalDataAccess` interface and its Angular dependency injection token `HOSPITAL_DATA_ACCESS`. Define domain models and types for clinical queries and commands: `TimeSlotQueryParams`, `TimeSlotsResult`, `DoctorEarningsReport`, `PatientVisitsReport`, `DateRange`, and `AddTreatmentResponse`. Establish an explicit domain error hierarchy (`HospitalDataError`, `BookingConflictError`, `PatientNotFoundError`) so network and business failures are modeled cleanly at the architectural boundary.

**Blocked by:** None (can start immediately)

**Status:** resolved

## Acceptance Criteria

- [x] `HospitalDataAccess` interface is declared in `src/app/services/hospital-data-access.ts` with reactive query methods returning `ResourceRef` and mutative command methods returning `Promise`.
- [x] `HOSPITAL_DATA_ACCESS` is exported as an `InjectionToken<HospitalDataAccess>('HOSPITAL_DATA_ACCESS')`.
- [x] Domain models and supporting query types (`TimeSlotQueryParams`, `TimeSlotsResult`, `DoctorEarningsReport`, `PatientVisitsReport`, `DateRange`, `AddTreatmentResponse`) are exported and aligned with `models.ts` and `GLOSSARY.md`.
- [x] Domain error classes (`HospitalDataError`, `BookingConflictError`, `PatientNotFoundError`) are defined and exported.
- [x] Unit tests verify token creation, error prototype inheritance, and type integrity.

## Comments

- Defined `HospitalDataAccess` port interface, `HOSPITAL_DATA_ACCESS` injection token, query contracts, and domain error hierarchy in `src/app/services/hospital-data-access.ts`.
- Implemented unit tests in `src/app/services/hospital-data-access.spec.ts` covering token definition, prototype inheritance, and custom error details.
- Verified test suite passes cleanly.
