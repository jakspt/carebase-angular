# 03: Eliminate Private Signal Mutations in Consultation Frequency Report

**What to build:** Remove all TypeScript type escapes (`(component as any).reportDataSignal.set(...)`) from the Consultation Frequency Report test suite, feeding consultation test records into the test double data store and allowing the component to load and derive KPIs through its public reactive pipeline.

**Blocked by:** 01 (Eradicate Manual fixture.detectChanges and Enforce Zoneless Stability)

**Status:** resolved

- [x] All instances of `(component as any)` mutating private signals in the Consultation Frequency Report test suite are removed
- [x] Test records are provided through the in-memory hospital data adapter configured in the test module
- [x] Unique patient totals, consultation frequency metrics, and date range filters are asserted against the component's public outputs and reactive derivations
- [x] Method and resource reload spying on the component's internal resources is removed in favor of observing resolved data state
