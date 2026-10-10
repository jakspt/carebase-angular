# 03: Wire Application Routes, HeaderLayout, and LandingPage to ActorSession

**What to build:** Update application routing in `app.routes.ts` to use `createRoleGuard` and `homeRedirectGuard`. Refactor `HeaderLayout` and `LandingPage` to inject and interact directly with `ActorSession` instead of `UserService`. Verify that navigating to `/clerk`, `/doctor`, or `/admin` and triggering a browser refresh persists the session and preserves the active route without redirecting to `/`.

**Blocked by:** 01: Implement Core ActorSession Service with Storage Persistence, 02: Implement Parameterized createRoleGuard Factory and Unified homeRedirectGuard

**Status:** ready-for-agent

## Acceptance Criteria

- [ ] `app.routes.ts` imports and wires `createRoleGuard('admin')`, `createRoleGuard('doctor')`, `createRoleGuard('clerk')`, and `homeRedirectGuard`.
- [ ] `HeaderLayout` injects `ActorSession` and binds active role display to `actorSession.role()`.
- [ ] `HeaderLayout.switchRole()` delegates to `actorSession.setRole(role)` and navigates to the landing page or selected role page.
- [ ] `HeaderLayout.logout()` calls `actorSession.clearSession()` and navigates to `/`.
- [ ] `LandingPage` injects `ActorSession`, and `visitDoctorSite()`, `visitClerkSite()`, `visitAdminSite()` delegate to `actorSession.setRole(...)` before navigation.
- [ ] Refreshing the browser on `/admin`, `/doctor/usecase`, or `/clerk/usecase` retains the active session and does not eject to `/`.
- [ ] Unit tests for `HeaderLayout` and `LandingPage` are updated to assert on `ActorSession` interactions.

## Comments

- Fixes the browser reload bug in end-to-end user navigation.
