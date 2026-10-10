# 04: Migrate Clinical Workflows to ActorSession and Retire Legacy UserService

**What to build:** Migrate `AppointmentIntakeWorkflow` and `ClerkService` to resolve and synchronize `activeClerk` directly through `ActorSession`. Permanently retire and delete the legacy 17-line in-memory `UserService` (`user-service.ts` and `user-service.spec.ts`). Run the entire project test suite to verify zero regressions, ensuring all unit tests and `ng build` pass with 0 errors.

**Blocked by:** 01: Implement Core ActorSession Service with Storage Persistence, 02: Implement Parameterized createRoleGuard Factory and Unified homeRedirectGuard, 03: Wire Application Routes, HeaderLayout, and LandingPage to ActorSession

**Status:** ready-for-agent

## Acceptance Criteria

- [ ] `AppointmentIntakeWorkflow` resolves active Clerk identity directly from `ActorSession.activeClerk()`.
- [ ] `ClerkService` delegates `getActiveClerk()` and `setActiveClerk()` to `ActorSession`, or callers are migrated to use `ActorSession` directly.
- [ ] Legacy `UserService` (`src/app/services/user-service.ts`) and its spec file (`user-service.spec.ts`) are deleted.
- [ ] Any lingering imports of `UserService` across the codebase are migrated to `ActorSession`.
- [ ] All existing unit tests pass cleanly (`npm test` / Vitest).
- [ ] Production build succeeds without errors (`ng build`).

## Comments

- Completes the consolidation of actor identity into a single deep module.
- Fully fulfills Candidate 4 of the architectural review.
