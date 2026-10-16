# 02: Extract pure Time Slot allocation engine and deepen in-memory adapter

**What to build:** Extract Time Slot calculation, conflict filtering, and the 14-day lookahead logic out of the in-memory data adapter into a pure domain engine function. The in-memory data adapter delegates to this engine, keeping Angular resource orchestration separate from algorithmic scheduling logic and enabling instant, deterministic unit testing of scheduling edge cases.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] A pure domain engine function calculates available 30-minute Time Slots between 08:00 and 17:00 for a given doctor and date, filtering out conflicts for doctor or patient.
- [x] When all Time Slots on the requested date are booked, the pure domain engine identifies the next available date within a 14-day forward window.
- [x] The calculation engine is free of Angular dependencies (no DI, signals, or resources) and covered by a comprehensive, fast unit test suite testing conflict scenarios and lookahead edge cases.
- [x] The in-memory data adapter delegates its time slot query handling to the pure engine while preserving the `HospitalDataAccess` port contract.
- [x] Existing Appointment Intake time slot selection and navigation work identically from the user's perspective.

