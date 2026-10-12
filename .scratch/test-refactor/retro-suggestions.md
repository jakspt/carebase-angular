# Retrospective Suggestions: Ticket 04 Session

**Originating Session:** Ticket 04 (`provideTestHospitalData` & Collaborator Spy Elimination)  
**Date:** 2026-10-12  
**Target Milestone:** Test Suite Refactoring ([`index.md`](file:///c:/Users/Jakob/Documents/git_projects/carebase-angular/.scratch/test-refactor/index.md))  
**Status:** Resolved (Actioned)

---

## 1. Summary of Session Accomplishments
- Implemented `provideTestHospitalData(): Provider[]` in [`in-memory-hospital-data-adapter.ts`](file:///c:/Users/Jakob/Documents/git_projects/carebase-angular/frontend/carebase-frontend/src/app/services/in-memory-hospital-data-adapter.ts).
- Enhanced `InMemoryHospitalDataAdapter.calculateSlots` with a dynamic 14-day candidate lookahead for `nextAvailableDate` matching backend `routes.py`.
- Migrated [`appointment-intake-workflow.spec.ts`](file:///c:/Users/Jakob/Documents/git_projects/carebase-angular/frontend/carebase-frontend/src/app/clerk-use-case/appointment-intake-workflow.spec.ts) and [`clerk-use-case.spec.ts`](file:///c:/Users/Jakob/Documents/git_projects/carebase-angular/frontend/carebase-frontend/src/app/clerk-use-case/clerk-use-case.spec.ts):
  - Removed all spies on `clerkService.bookAppointment`, `dataAccess.getDoctors`, `dataAccess.getTimeSlots`, and `timeSlotsResource.reload`.
  - Replaced call-count assertions (`toHaveBeenCalled`, `toHaveBeenCalledWith`) with assertions on retrievable appointment records and slot unavailability in the data store.
  - Replaced `mockSlotsSignal` with real slot saturation via `dataAccess.bookAppointment`.
  - Replaced port spying on error tests with public failure injection doubles.
- Ticket 04 marked `complete` in commit `d7f9155`. All 19 test files (156 tests) passing.

---

## 2. Actionable Retro Candidates for Future Sessions (Ranked by Severity)

### Candidate 1: Document Sandbox Execution Requirement for Windows Node / npx
- **Category:** Environment / Tooling
- **Observation:** `npx` and `node` on this host reside in `C:\nvm4w\nodejs` (outside the standard sandbox filesystem boundary). The first command in a fresh session will fail with `CommandNotFoundException` unless run outside the sandbox (`BypassSandbox: true`).
- **Proposed Action:** Update [`AGENTS.md`](file:///c:/Users/Jakob/Documents/git_projects/carebase-angular/AGENTS.md) under `Project Structure` with a note:
  > *Windows CLI note: Node.js and npm run from `C:\nvm4w\nodejs` and require execution with unsandboxed permissions (`BypassSandbox: true`).*
- **Resolution:** Implemented. Documented in [`AGENTS.md`](file:///c:/Users/Jakob/Documents/git_projects/carebase-angular/AGENTS.md) under `Project Structure`.

### Candidate 2: Document Port Failure Testing Pattern (Ban Spy on Port Methods)
- **Category:** Coding Standards
- **Observation:** When migrating away from `clerkService.bookAppointment` spies, agents may be tempted to spy on `dataAccess.bookAppointment` instead for testing error states. Both Standards and Spec reviewers flagged this.
- **Proposed Action:** In [`docs/adr/0003-frontend-testing-standards-and-harnesses.md`](file:///c:/Users/Jakob/Documents/git_projects/carebase-angular/docs/adr/0003-frontend-testing-standards-and-harnesses.md), document the canonical pattern for simulating infrastructure errors:
  1. Pass an explicit failure stub via Angular DI: `{ provide: HOSPITAL_DATA_ACCESS, useValue: failingDataAccess }`, or
  2. Temporarily reassign `dataAccess.bookAppointment = async () => { throw new Error(...) }` with cleanup in a `finally` block.
  3. Never use `vi.spyOn` on hexagonal port interfaces.
- **Resolution:** Implemented. Documented in [`docs/adr/0003-frontend-testing-standards-and-harnesses.md`](file:///c:/Users/Jakob/Documents/git_projects/carebase-angular/docs/adr/0003-frontend-testing-standards-and-harnesses.md).

### Candidate 3: Navigation Pointer for Test DI Providers
- **Category:** Navigation
- **Observation:** `provideTestHospitalData()` was requested in Ticket 04, but the repo lacked a dedicated `testing/` directory or an ADR pointer documenting where test DI helper functions should live.
- **Proposed Action:** Add a navigation pointer in [`docs/adr/0003-frontend-testing-standards-and-harnesses.md`](file:///c:/Users/Jakob/Documents/git_projects/carebase-angular/docs/adr/0003-frontend-testing-standards-and-harnesses.md) stating that shared test providers are co-located with their respective adapter modules (e.g. `src/app/services/in-memory-hospital-data-adapter.ts`).
- **Resolution:** Implemented. Documented in [`docs/adr/0003-frontend-testing-standards-and-harnesses.md`](file:///c:/Users/Jakob/Documents/git_projects/carebase-angular/docs/adr/0003-frontend-testing-standards-and-harnesses.md).

### Candidate 4: Specify Required Adapter Capabilities in Issue Pre-Conditions
- **Category:** Spec Clarity / Information Access
- **Observation:** When UI component suites test features like proactive "Next Available Date" banners, running them against `InMemoryHospitalDataAdapter` requires the adapter to calculate that date. Ticket 04 did not explicitly mention that `InMemoryHospitalDataAdapter.calculateSlots` needed to support lookahead, causing the spec reviewer to flag it as potential scope creep.
- **Proposed Action:** When authoring future tickets that eliminate mock signals in UI components, explicitly state which backend parity features the in-memory adapter must satisfy.
- **Resolution:** Implemented. Adopted as standard convention for authoring and reviewing remaining tickets in `.scratch/test-refactor/issues/`.

### Candidate 5: Optimize Vitest Execution Turns
- **Category:** Tool Economy
- **Observation:** Single-file spec runs (`npx ng test --watch=false --include="**/<name>.spec.ts"`) take ~1.8–3.5s with a warm cache. Setting `WaitMsBeforeAsync: 10000` allows synchronous completion within a single turn, avoiding unnecessary background task dispatch and notification wakeups.
- **Resolution:** Implemented. Documented in [`AGENTS.md`](file:///c:/Users/Jakob/Documents/git_projects/carebase-angular/AGENTS.md) under `Project Structure`.

