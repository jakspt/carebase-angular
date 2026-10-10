# 02: Implement Parameterized createRoleGuard Factory and Unified homeRedirectGuard

**What to build:** Create a parameterized functional route guard factory `createRoleGuard(requiredRole: ActorRole): CanActivateFn` and a unified `homeRedirectGuard: CanActivateFn` that inject `ActorSession` and `Router`. `createRoleGuard` validates that the active session matches the specified role, redirecting unauthenticated or mismatched sessions to `/`. `homeRedirectGuard` redirects authenticated sessions to their designated workspace (`/admin`, `/doctor`, `/clerk`) and permits unauthenticated visitors to view the landing page. Delete the four legacy duplicate guard files (`admin-guard.ts`, `clerk-guard.ts`, `doctor-guard.ts`, `home-redirect-guard-guard.ts`).

**Blocked by:** 01: Implement Core ActorSession Service with Storage Persistence

**Status:** ready-for-agent

## Acceptance Criteria

- [ ] `createRoleGuard(requiredRole: ActorRole): CanActivateFn` is implemented and returns `true` if `actorSession.role() === requiredRole`.
- [ ] `createRoleGuard` returns `router.createUrlTree(['/'])` if no active session or role mismatch.
- [ ] `homeRedirectGuard: CanActivateFn` is implemented and redirects authenticated actors to `/admin`, `/doctor`, or `/clerk`, or returns `true` for unauthenticated visitors.
- [ ] The four duplicate guard files are permanently deleted:
  - `src/app/guards/admin-guard.ts`
  - `src/app/guards/clerk-guard.ts`
  - `src/app/guards/doctor-guard.ts`
  - `src/app/guards/home-redirect-guard-guard.ts`
- [ ] Headless unit tests verify authorized access, unauthorized redirects, and landing page redirection behavior across all three roles using `TestBed.runInInjectionContext()`.

## Comments

- Replaces duplicated boilerplate across four separate guard files with one DRY functional factory.
