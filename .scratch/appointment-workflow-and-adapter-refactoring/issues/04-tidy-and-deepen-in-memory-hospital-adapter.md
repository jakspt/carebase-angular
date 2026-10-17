# 04: Tidy and Deepen In-Memory Hospital Adapter

**What to build:** A streamlined in-memory persistence adapter that eliminates boilerplate and fragile mock objects. Standardizes query resource definitions, simplifies database loading simulations, and aligns conflict error naming with the canonical domain glossary.

**Blocked by:** 03: Implement Data Access Interface Segregation

**Status:** ready-for-agent

- [ ] Database status query eliminates the synthetic 20-line mock resource object in favor of standard resource semantics when loading simulation is active.
- [ ] Query methods in the in-memory adapter utilize a concise internal helper to reduce repetitive resource setup boilerplate.
- [ ] Canonical `AppointmentConflictError` is established per the domain glossary, with `BookingConflictError` maintained as a backward-compatible alias.
- [ ] In-memory adapter test suite passes with zero regressions.
