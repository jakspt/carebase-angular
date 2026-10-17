# 03: Implement Data Access Interface Segregation

**What to build:** Segregated capability contracts for data access (Scheduling, Clinical, Reporting, System) with dedicated dependency injection tokens. Aliases each capability token to the underlying persistence adapter via Angular's dependency injection, ensuring feature modules only depend on the operations they need while preserving a unified adapter behind the scenes.

**Blocked by:** 02: Reorganize Services Directory into Sub-Domains

**Status:** claimed

- [ ] Master data access contract is decomposed into four capability interfaces: Scheduling, Clinical, Reporting, and System.
- [ ] Master hospital data access interface extends all four capability interfaces for composite backward compatibility.
- [ ] Dedicated Angular injection tokens are introduced for Scheduling, Clinical, Reporting, and System data access.
- [ ] Provider configuration helper registers the adapter and aliases all capability tokens to the master token using Angular `useExisting`.
- [ ] Domain consumers (Doctor use case, Doctor report, Clerk report, Admin page, Header layout) inject their respective capability tokens.
- [ ] Dependency injection aliasing tests verify that injecting capability tokens returns the exact master adapter instance.
