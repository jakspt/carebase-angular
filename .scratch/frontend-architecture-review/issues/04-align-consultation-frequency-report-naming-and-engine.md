# 04: Align Consultation Frequency Report domain naming and extract pure aggregation engine

**What to build:** Align the hexagonal data access port, adapters, and report view with the canonical domain glossary term `Consultation Frequency Report` (retiring `PatientVisitsReport`), and extract the visit aggregation calculation into a pure domain engine function.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] A pure domain engine function aggregates consultation visit counts per patient-doctor pair within a date range from stored appointments, patient records, and doctor records, covered by pure unit tests.
- [x] The `HospitalDataAccess` port, `InMemoryHospitalDataAdapter`, `HttpHospitalDataAdapter`, and `ClerkReport` use `ConsultationFrequencyReport` and `getConsultationFrequencyReport`.
- [x] A backwards-compatible type alias is provided so existing references remain valid.
- [x] The in-memory adapter delegates report calculation to the pure aggregation engine.
- [x] The Consultation Frequency Report view and filters function identically from the user's perspective.
