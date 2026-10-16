# 03: Extract pure Doctor earnings engine and deepen in-memory adapter

**What to build:** Extract the annual doctor earnings calculation and treatment cost aggregation from the in-memory data adapter into a pure domain engine function. The in-memory data adapter delegates to this engine, allowing financial calculation edge cases to be tested instantly as pure mathematical transformations.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] A pure domain engine function aggregates total treatment costs per doctor for a target calendar year from stored appointments and doctor records.
- [x] The calculation engine is free of Angular dependencies (no DI, signals, or resources) and covered by a comprehensive, fast unit test suite covering zero-treatment doctors, multiple treatments, and cross-year filtering.
- [x] The in-memory data adapter delegates its doctor earnings report calculation to the pure engine while preserving the `HospitalDataAccess` port contract.
- [x] The Doctor earnings report view displays accurate calculated earnings and behaves identically from the user's perspective.
