# 02: Implement Production HttpHospitalDataAdapter with httpResource and Envelope Unwrapping

**What to build:** Implement `HttpHospitalDataAdapter` as an injectable service fulfilling the `HospitalDataAccess` port. The adapter interacts with backend HTTP endpoints using Angular v22's `httpResource` configured with the declarative `parse` transformation option. The `parse` functions unwrap backend response envelopes (`{ doctors: Doctor[] }` -> `Doctor[]`, `{ patients: Patient[] }` -> `Patient[]`, `{ medications: Medication[] }` -> `Medication[]`, `{ clerks: Clerk[] }` -> `Clerk[]`). Query parameter serialization, URL construction, and injection context management are centralized and encapsulated within the adapter. Mutative commands (`bookAppointment`, `addTreatment`) delegate to `HttpClient` and translate HTTP errors (such as 409 Conflict) into structured domain errors (`BookingConflictError`, `HospitalDataError`).

**Blocked by:** 01: Define HospitalDataAccess Port, Token, and Domain Error Hierarchy

**Status:** ready-for-agent

## Acceptance Criteria

- [ ] `HttpHospitalDataAdapter` implements `HospitalDataAccess` and is marked `@Injectable({ providedIn: 'root' })`.
- [ ] Uses `httpResource` with `parse` to unwrap `{ doctors: Doctor[] }`, `{ patients: Patient[] }`, `{ medications: Medication[] }`, and `{ clerks: Clerk[] }` into unwrapped arrays.
- [ ] Centralizes query string formatting and URL construction for patient search, clerk search, time slots, doctor earnings, and patient visit reports.
- [ ] Encapsulates `Injector` internally so callers can invoke query methods without supplying an external injection context.
- [ ] `bookAppointment` and `addTreatment` return Promises and translate 409 status codes to `BookingConflictError` and network/server errors to `HospitalDataError`.
- [ ] Unit tests using `provideHttpClientTesting()` verify URL formatting, query serialization, parse unwrapping, and error translation.
