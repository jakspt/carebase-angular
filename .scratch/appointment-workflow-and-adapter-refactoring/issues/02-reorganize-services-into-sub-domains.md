# 02: Reorganize Services Directory into Sub-Domains

**What to build:** A structured sub-domain layout for services that partitions pure algorithmic calculation engines from hexagonal persistence adapters and contracts. Provides a root services barrel export that preserves complete backward compatibility for all existing callers across the application.

**Blocked by:** None (can start immediately)

**Status:** claimed

- [ ] Subdirectory for pure calculation engines is created and houses the time-slot, doctor earnings, and consultation frequency engines alongside their unit tests.
- [ ] Subdirectory for data access is created and houses the hospital data access port, HTTP adapter, in-memory adapter, and fixture generators alongside their tests.
- [ ] Cross-cutting authentication session and operation runner services remain at the services root.
- [ ] Root services barrel re-exports all public symbols, ensuring zero broken imports across existing components and specs.
- [ ] Existing test suites compile and pass without import regressions.
