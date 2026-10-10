# Unified Actor Session and Role Navigation

Status: ready-for-agent

## Problem Statement

In the hospital information system, access to clinical and administrative views is organized around three distinct actors: Doctors (who review Patient records and record Treatments), Clerks (who schedule Appointments), and Administrators (who manage database operations).

Currently, actor identity, role authorization, and navigation are scattered across disjointed, shallow modules. A 17-line in-memory `UserService` holds an ephemeral `currentUser` signal (`'doctor' | 'admin' | 'clerk' | undefined`) with zero persistence. Concurrently, `ClerkService` maintains its own separate `activeClerk` signal backed by browser `sessionStorage`, while Doctor and Administrator actors have no identity persistence at all. Furthermore, route authorization is fragmented across four practically identical functional guard files (`adminGuard`, `clerkGuard`, `doctorGuard`, `homeRedirectGuardGuard`) that repeat manual inspection of the in-memory user signal and hardcoded URL tree redirects.

This shallow design causes a critical defect: whenever a user refreshes the browser while working in a protected clinical view (such as `/clerk/usecase` or `/doctor/usecase`), the in-memory role is instantly lost. The route guard executes before any state can be recovered, detects an unauthenticated state, and immediately ejects the user back to the landing page (`/`). This destroys the active clinical workflow, causes frustration, and prevents deep linking. Moreover, actor identity is decoupled from role management, meaning the system cannot reliably determine which Doctor or Clerk is currently authenticated.

## Solution

Consolidate actor identity, role management, session persistence, and route authorization into a single deep **Actor Session** module (`ActorSession` or `SessionService`).

The Actor Session module encapsulates:
1. **Unified Actor Model**: Represents the active actor's role (`'admin' | 'doctor' | 'clerk' | null`) alongside their specific domain identity (such as the active Clerk's name and Social Security Number (SSN), or the active Doctor's details).
2. **Automatic Session Persistence & Hydration**: Automatically persists active session state to browser `sessionStorage` and restores it seamlessly on page reloads and browser restarts. Hydration is robust against Server-Side Rendering (SSR) and restricted storage environments.
3. **Page Reload Preservation**: Eliminates the reload eject defect. Refreshing `/clerk/usecase`, `/doctor/usecase`, or `/admin` preserves the active session, allowing users to remain seamlessly in their workflow.
4. **Reusable Parameterized Route Guard Factory**: Replaces the four duplicate guard modules with a single, highly reusable functional guard factory: `createRoleGuard(requiredRole)`. The factory verifies that an active session exists with the required role; if unauthorized, it redirects to the landing page.
5. **Unified Home Redirect Guard**: A clean functional guard that routes authenticated sessions directly to their respective workspace (`/clerk`, `/doctor`, `/admin`) while allowing unauthenticated visitors to view the landing page.
6. **Centralized Role Switching & Logout**: Atomic methods for switching active roles or completely clearing session state, ensuring no orphaned data remains in storage.

## User Stories

1. As a Clerk, I want my active session and selected Clerk identity to persist when I refresh the browser, so that I do not lose my place in the Appointment intake workflow.
2. As a Clerk, I want to access `/clerk` and `/clerk/usecase` directly if I already have an active Clerk session, so that I can resume scheduling Appointments without visiting the landing page first.
3. As a Clerk, I want my active Clerk profile (name and SSN) linked to my session, so that scheduled Appointments automatically record my acting identity.
4. As a Doctor, I want my active Doctor role to persist across browser reloads, so that reviewing Patient records and recording Treatments is not interrupted by accidental page refreshes.
5. As a Doctor, I want to navigate directly to `/doctor` or `/doctor/usecase` when authenticated, so that I can access clinical tools immediately.
6. As an Administrator, I want my Administrator role preserved during browser reloads, so that long-running database operations and reports can be monitored without session loss.
7. As a User, I want the landing page (`/`) to automatically redirect me to my active workspace (`/clerk`, `/doctor`, `/admin`) if I am already authenticated, so that I don't have to re-select my role on every visit.
8. As a User, I want to switch my active role from the header toolbar at any time, so that I can test different perspectives in the hospital system.
9. As a User, I want logging out from the header toolbar to immediately clear all stored session credentials and redirect me to the landing page, so that no residual actor data persists.
10. As an Unauthorized User, I want attempts to navigate directly to protected routes (`/admin`, `/doctor/*`, `/clerk/*`) to redirect safely to the landing page, so that unauthorized access is prevented.
11. As a Frontend Maintainer, I want actor roles and identity unified into a single `ActorSession` module, so that session logic is not split between user services and clerk services.
12. As a Frontend Maintainer, I want a single parameterized `createRoleGuard(role)` factory replacing the four duplicate guard files, so that route protection logic is centralized and DRY.
13. As a Frontend Maintainer, I want session persistence handled gracefully in SSR and test environments, so that storage access never throws runtime errors.
14. As a Frontend Maintainer, I want to test role guards and navigation logic headlessly using standard Angular Router testing utilities, so that guard suites run fast and reliably.
15. As a Frontend Maintainer, I want the deletion of four legacy guard files (`admin-guard.ts`, `clerk-guard.ts`, `doctor-guard.ts`, `home-redirect-guard-guard.ts`), so that codebase mass is reduced and maintenance is simplified.

## Implementation Decisions

1. **Deep Actor Session Module**:
   - Provide an `ActorSession` service managing session state, persistence, and transitions.
   - Prototype type shape:

     ```ts
     export type ActorRole = 'admin' | 'doctor' | 'clerk';

     export interface ActorSessionState {
       role: ActorRole | null;
       activeClerk: Clerk | null;
       activeDoctor: Doctor | null;
     }

     export interface ActorSession {
       role: Signal<ActorRole | null>;
       activeClerk: Signal<Clerk | null>;
       activeDoctor: Signal<Doctor | null>;
       isAuthenticated: Signal<boolean>;
       setRole(role: ActorRole, actor?: Clerk | Doctor | null): void;
       clearSession(): void;
     }
     ```

2. **Session Storage Persistence with Fallback**:
   - Automatically synchronizes `role` and active actor details to `sessionStorage` under a unified key (`carebase_actor_session`).
   - Hydrates on service instantiation.
   - Includes try/catch guards to safely handle SSR, private browsing modes, and storage-disabled environments.

3. **Parameterized Functional Route Guard Factory**:
   - A single function `createRoleGuard(requiredRole: ActorRole): CanActivateFn` that injects `ActorSession` and `Router`.
   - Returns `true` if `session.role() === requiredRole`, or returns `Router.createUrlTree(['/'])` otherwise.
   - Replaces `adminGuard`, `clerkGuard`, and `doctorGuard`.

4. **Unified Home Redirect Guard**:
   - Functional guard `homeRedirectGuard: CanActivateFn` that inspects `ActorSession.role()`.
   - If an active role is present, returns `UrlTree` to `/admin`, `/doctor`, or `/clerk`. Otherwise returns `true` to allow rendering the landing page.
   - Deletes `home-redirect-guard-guard.ts`.

5. **Header Toolbar and Landing Page Alignment**:
   - `HeaderLayout` and `LandingPage` delegate all role switching and logout actions directly to `ActorSession`.

## Testing Decisions

1. **Test External Behavior, Not Implementation Details**:
   - Tests verify that setting a role updates signals and writes to storage; test that reloading/re-instantiating hydrates from storage; test that clearing session removes stored state.
   - Do not assert on private internal storage serialization keys or private timer intervals.

2. **Modules to Test**:
   - **ActorSession Service Unit Tests**: Role setting, active actor association, session storage serialization and deserialization, and storage error resilience.
   - **Route Guard Tests**: `createRoleGuard` returns true when role matches, returns UrlTree to `/` when role mismatches or session is null. `homeRedirectGuard` redirects correctly for all roles and allows landing page when no session is active.

3. **Prior Art in the Codebase**:
   - Follow existing Angular router guard testing patterns using `TestBed.runInInjectionContext()`.

## Out of Scope

- **Backend Authentication Infrastructure**: Real authentication protocols (OAuth2, OIDC, JWT tokens) or backend credential validation remain out of scope (this application is a demonstration environment).
- **Clinical Workflow State**: Form values and step progress inside specific clinical workflows are not persisted across browser reloads.
- **Visual Presentation**: Visual appearance and layout of the landing page, action cards, and header toolbar remain unchanged.

## Further Notes

- This refactoring fulfills Candidate 4 ("Unify Actor Identity and Role Navigation") from the codebase architectural review.
- The terminology in this specification strictly conforms to the canonical domain definitions in `GLOSSARY.md` (Doctor, Clerk, Patient, Department, Appointment, Time Slot, SSN, NACA Score).
