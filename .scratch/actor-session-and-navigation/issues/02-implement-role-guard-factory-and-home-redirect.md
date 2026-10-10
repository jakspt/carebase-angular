# 02: Implement Parameterized createRoleGuard Factory and Unified homeRedirectGuard

**What to build:** Create a parameterized functional route guard factory `createRoleGuard(requiredRole: ActorRole): CanActivateFn` and a unified `homeRedirectGuard: CanActivateFn` that inject `ActorSession` and `Router`. `createRoleGuard` validates that the active session matches the specified role, redirecting unauthenticated or mismatched sessions to `/`. `homeRedirectGuard` redirects authenticated sessions to their designated workspace (`/admin`, `/doctor`, `/clerk`) and permits unauthenticated visitors to view the landing page. Delete the four legacy duplicate guard files (`admin-guard.ts`, `clerk-guard.ts`, `doctor-guard.ts`, `home-redirect-guard-guard.ts`).

**Blocked by:** 01: Implement Core ActorSession Service with Storage Persistence

**Status:** resolved

## Acceptance Criteria

- [x] `createRoleGuard(requiredRole: ActorRole): CanActivateFn` is implemented and returns `true` if `actorSession.role() === requiredRole`.
- [x] `createRoleGuard` returns `router.createUrlTree(['/'])` if no active session or role mismatch.
- [x] `homeRedirectGuard: CanActivateFn` is implemented and redirects authenticated actors to `/admin`, `/doctor`, or `/clerk`, or returns `true` for unauthenticated visitors.
- [x] The four duplicate guard files are permanently deleted:
  - `src/app/guards/admin-guard.ts`
  - `src/app/guards/clerk-guard.ts`
  - `src/app/guards/doctor-guard.ts`
  - `src/app/guards/home-redirect-guard-guard.ts`
- [x] Headless unit tests verify authorized access, unauthorized redirects, and landing page redirection behavior across all three roles using `TestBed.runInInjectionContext()`.

## Comments

- Implemented `createRoleGuard` and `homeRedirectGuard` in `src/app/guards/role-guard.ts`.
- Deleted four legacy guard files and replaced `clerk-guard.spec.ts` with `src/app/guards/role-guard.spec.ts` covering 14 guard scenarios.
- Updated `src/app/app.routes.ts` to wire new guards.
- Verified all unit tests and `ng build` pass with 0 errors.
