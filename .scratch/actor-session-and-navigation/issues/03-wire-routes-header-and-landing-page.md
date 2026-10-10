# 03: Wire Application Routes, HeaderLayout, and LandingPage to ActorSession

**What to build:** Update application routing in `app.routes.ts` to use `createRoleGuard` and `homeRedirectGuard`. Refactor `HeaderLayout` and `LandingPage` to inject and interact directly with `ActorSession` instead of `UserService`. Verify that navigating to `/clerk`, `/doctor`, or `/admin` and triggering a browser refresh persists the session and preserves the active route without redirecting to `/`.

**Blocked by:** 01: Implement Core ActorSession Service with Storage Persistence, 02: Implement Parameterized createRoleGuard Factory and Unified homeRedirectGuard

**Status:** resolved

## Acceptance Criteria

- [x] `app.routes.ts` imports and wires `createRoleGuard('admin')`, `createRoleGuard('doctor')`, `createRoleGuard('clerk')`, and `homeRedirectGuard`.
- [x] `HeaderLayout` injects `ActorSession` and binds active role display to `actorSession.role()`.
- [x] `HeaderLayout.switchRole()` delegates to `actorSession.setRole(role)` and navigates to the landing page or selected role page.
- [x] `HeaderLayout.logout()` calls `actorSession.clearSession()` and navigates to `/`.
- [x] `LandingPage` injects `ActorSession`, and `visitDoctorSite()`, `visitClerkSite()`, `visitAdminSite()` delegate to `actorSession.setRole(...)` before navigation.
- [x] Refreshing the browser on `/admin`, `/doctor/usecase`, or `/clerk/usecase` retains the active session and does not eject to `/`.
- [x] Unit tests for `HeaderLayout` and `LandingPage` are updated to assert on `ActorSession` interactions.

## Comments

- Refactored `HeaderLayout` and `LandingPage` to interact directly with `ActorSession`.
- Updated unit tests in `src/app/header-layout/header-layout.spec.ts` and `src/app/landing-page/landing-page.spec.ts`.
- Verified all unit tests and `ng build` pass with 0 errors.
