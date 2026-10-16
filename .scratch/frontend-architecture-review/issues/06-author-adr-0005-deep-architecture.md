# 06: Author ADR 0005 for frontend deepening, seam simplification, and forwarder retirement

**What to build:** Record Architectural Decision Record 0005 documenting the architectural shift to deep adapters, pure domain calculation engines, direct template-to-workflow bindings, retirement of shallow forwarder services, and component-harness test consolidation.

**Blocked by:** 01: Retire shallow DoctorService and ClerkService, 02: Extract pure Time Slot allocation engine and deepen in-memory adapter, 03: Extract pure Doctor earnings engine and deepen in-memory adapter, 04: Align Consultation Frequency Report domain naming and extract pure aggregation engine, 05: Collapse artificial seam in Appointment Intake and deduplicate test suites

**Status:** resolved

- [x] ADR 0005 is created under `docs/adr/0005-frontend-deepening-and-seam-simplification.md`.
- [x] The document details the context, problem statement, options considered, decisions taken, consequences, and testing standards.
- [x] The rationale for extracting pure calculation engines and eliminating shallow forwarder proxies is clearly explained.
- [x] The testing boundaries between pure domain engines, hexagonal adapters, and CDK component harnesses are defined.
