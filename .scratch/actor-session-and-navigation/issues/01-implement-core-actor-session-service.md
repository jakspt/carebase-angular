# 01: Implement Core ActorSession Service with Storage Persistence

**What to build:** Create an `ActorSession` service that unifies actor role state (`'admin' | 'doctor' | 'clerk' | null`) and domain identity (such as active Clerk details) into a single deep module. The service automatically serializes session state to `sessionStorage` (`carebase_actor_session`) and hydrates on instantiation, eliminating the browser reload bug while safely handling SSR and restricted storage environments. Exposes signals for `role`, `activeClerk`, `activeDoctor`, and `isAuthenticated`, with methods `setRole(role, actor?)` and `clearSession()`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

## Acceptance Criteria

- [ ] `ActorSession` is implemented as an injectable singleton service (`providedIn: 'root'`).
- [ ] Defines domain types `ActorRole` (`'admin' | 'doctor' | 'clerk'`) and `ActorSessionState`.
- [ ] Exposes reactive signals: `role()`, `activeClerk()`, `activeDoctor()`, and computed `isAuthenticated()`.
- [ ] `setRole(role, actor?)` updates active role and associated actor identity, atomically synchronizing to `sessionStorage`.
- [ ] `clearSession()` resets all actor signals and purges storage keys.
- [ ] Hydration runs on service construction, recovering active role and clerk/doctor profiles across browser refreshes.
- [ ] Gracefully handles environments without `window.sessionStorage` (SSR, testing, disabled cookies) via try/catch fallbacks.
- [ ] Headless unit tests verify role transitions, persistence, hydration, session clearance, and storage failure fallbacks.

## Comments

- Will replace the shallow 17-line in-memory `UserService`.
- Prepares for migrating `activeClerk` persistence out of `ClerkService`.
