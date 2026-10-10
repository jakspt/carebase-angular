# 04: Migrate Clinical Workflows to ActorSession and Retire Legacy UserService

**What to build:** Migrate `AppointmentIntakeWorkflow` and `ClerkService` to resolve and synchronize `activeClerk` directly through `ActorSession`. Permanently retire and delete the legacy 17-line in-memory `UserService` (`user-service.ts` and `user-service.spec.ts`). Run the entire project test suite to verify zero regressions, ensuring all unit tests and `ng build` pass with 0 errors.

**Blocked by:** 01: Implement Core ActorSession Service with Storage Persistence, 02: Implement Parameterized createRoleGuard Factory and Unified homeRedirectGuard, 03: Wire Application Routes, HeaderLayout, and LandingPage to ActorSession

**Status:** resolved

## Acceptance Criteria

- [x] `AppointmentIntakeWorkflow` resolves active Clerk identity directly from `ActorSession.activeClerk()`.
- [x] `ClerkService` delegates `getActiveClerk()` and `setActiveClerk()` to `ActorSession`, or callers are migrated to use `ActorSession` directly.
- [x] Legacy `UserService` (`src/app/services/user-service.ts`) and its spec file (`user-service.spec.ts`) are deleted.
- [x] Any lingering imports of `UserService` across the codebase are migrated to `ActorSession`.
- [x] All existing unit tests pass cleanly (`npm test` / Vitest).
- [x] Production build succeeds without errors (`ng build`).

## Comments

- Migrated `AppointmentIntakeWorkflow` and `ClerkService` to resolve active Clerk identity via `ActorSession`.
- Permanently deleted legacy `UserService` (`user-service.ts`) and its spec file (`user-service.spec.ts`).
- Verified all 117 tests pass in `npm test` and production build succeeds with 0 errors.
