# Test Infrastructure Hardening Specification

Status: ready-for-agent

## Problem Statement

Following the completion of the CareBase frontend test refactoring milestone, maintainers and coding agents encounter friction in three specific areas across test setup, testing standards, and the automated review process:

1. **Duplicated Service Test Mocks**: When writing specifications for components consuming `AdminService` (such as the application root `App` shell and `HeaderLayout`), tests duplicate manual object stubs for `statusResource` rather than sharing a standardized, co-located test dependency injection provider like `provideTestHospitalData()`.
2. **Undocumented Reactive Autocomplete Stabilization**: Developers and agents testing Angular Material autocomplete components driven by debounced reactive signals encounter intermittent test flakiness where `MatAutocompleteHarness.selectOption()` throws closed-panel exceptions under concurrent test runner loads, because the canonical stabilization pattern is not documented in ADR-0003.
3. **Spec Review False Positives on Flakiness Fixes**: During automated two-axis code reviews, the Spec Review sub-agent incorrectly flags flakiness and determinism bugfixes as "scope creep", even when passing 100% of the test suite is an explicit acceptance criterion of the originating ticket.

## Solution

Implement targeted test infrastructure improvements addressing retrospective suggestions 3, 4, and 5:

1. **Standardized Test DI Provider for AdminService**: Author and export a reusable `provideTestAdminService()` helper function co-located in `src/app/services/admin-service.ts` that provides `AdminService` backed by deterministic reactive status signals, and adopt it in `src/app/app.spec.ts` and `src/app/header-layout/header-layout.spec.ts`.
2. **ADR-0003 Documentation for Reactive Autocomplete Stabilization**: Update `docs/adr/0003-frontend-testing-standards-and-harnesses.md` to document the canonical, deterministic pattern for interacting with debounced Angular Material autocompletes via `MatAutocompleteHarness` and `vi.waitFor`.
3. **Spec Review Prompt Clarification on Test Flakiness**: Update `.agents/skills/code-review/SKILL.md` to explicitly state that determinism and flakiness fixes strictly necessary to fulfill green test suite criteria do not constitute scope creep.

## User Stories

1. As a Frontend Maintainer, I want a reusable `provideTestAdminService()` test dependency injection provider co-located with `admin-service.ts`, so that component test suites do not duplicate ad-hoc stubs for administrative status signals.
2. As a Frontend Maintainer, I want `provideTestAdminService()` to allow specifying initial or overridden database connection status parameters, so that diverse administrative states (connected MariaDB, connected MongoDB, loading, offline) can be tested cleanly.
3. As a Frontend Maintainer, I want `src/app/app.spec.ts` to use `provideTestAdminService()`, so that application shell specs stay concise and comply with repository DI conventions.
4. As a Frontend Maintainer, I want `src/app/header-layout/header-layout.spec.ts` to use `provideTestAdminService()`, so that header layout tests eliminate duplicated mock definitions.
5. As a Frontend Maintainer, I want the canonical stabilization pattern for `MatAutocompleteHarness` documented in ADR-0003, so that developers and agents write deterministic autocomplete tests that never flake under concurrent test runs.
6. As a Frontend Maintainer, I want the documented autocomplete pattern to mandate verifying panel open state and focusing before option selection, so that race conditions between debounce microtasks and panel animations are prevented.
7. As a Coding Agent, I want clear instructions in the `code-review` skill instructing the Spec Reviewer that test stability fixes needed to achieve 100% test pass rates are within scope, so that valid pull requests are not flagged with false-positive scope creep warnings.
8. As a Coding Agent, I want the Spec Review sub-agent to distinguish between genuine feature additions and necessary test harness stabilization, so that code reviews remain focused and accurate.

## Implementation Decisions

1. **Co-located Admin Test Provider Function**:
   - Following the precedent of `provideTestHospitalData()` in `in-memory-hospital-data-adapter.ts`, export a provider function in `src/app/services/admin-service.ts`:
     ```typescript
     export function provideTestAdminService(options?: {
       dbType?: string;
       isLoading?: boolean;
       hasValue?: boolean;
     }): Provider[]
     ```
   - The provider replaces manual `{ provide: AdminService, useValue: mockAdminService }` object literals in `app.spec.ts` and `header-layout.spec.ts`.
2. **ADR-0003 Enhancement for Autocomplete Stability**:
   - Add a dedicated section to `docs/adr/0003-frontend-testing-standards-and-harnesses.md` detailing the required pattern for testing `MatAutocompleteHarness` alongside debounced Angular Signals and Resources.
   - Prescribe deterministic polling with `vi.waitFor` ensuring `isOpen()` is true prior to executing `.selectOption()`.
3. **Refined Code Review Sub-Agent Guidelines**:
   - Update `SKILL.md` under `.agents/skills/code-review/` in the Spec Reviewer brief section.
   - Add explicit guidance: when a ticket includes an acceptance criterion requiring all tests to pass green, adjustments that fix test determinism or resolve timing race conditions are in-scope maintenance, not scope creep.

## Testing Decisions

1. **What Makes a Good Test**:
   - Verification must happen through existing seams without mocking internal port implementations.
   - Tests consuming `provideTestAdminService()` must continue verifying public user interactions (e.g. toolbar rendering and role switching menus).
2. **Modules Under Test**:
   - `src/app/services/admin-service.ts` and its test consumers (`src/app/app.spec.ts`, `src/app/header-layout/header-layout.spec.ts`).
3. **Primary Seams**:
   - **Seam 1 (Dependency Injection Seam)**: `AdminService` dependency injection through `provideTestAdminService()`.
   - **Seam 2 (Component Harness Seam)**: `MatToolbarHarness` and `MatMenuHarness` verifying template interactions against `AdminService` state.
4. **Prior Art**:
   - `provideTestHospitalData()` in `src/app/services/in-memory-hospital-data-adapter.ts`.
   - `docs/adr/0003-frontend-testing-standards-and-harnesses.md`.

## Out of Scope

- **Retro Items 1 and 2**: Enabling `noUnusedLocals` in `tsconfig.spec.json` and adding Windows sandbox lockfile notes to `AGENTS.md` (to be performed directly by the user).
- **Production Admin Service Logic**: Modifying actual backend HTTP routes or API responses in Python/Flask.
- **Visual Redesign**: Modifying header layout styling, logos, or typography.

## Further Notes

- **Ubiquitous Language Compliance**: Adheres strictly to `GLOSSARY.md` concepts (`System Administrator`, `Hospital Clerk`, `Doctor`, `Actor Session`).
- **Standardized Co-location**: Reinforces ADR-0003's guideline that test providers are co-located with their respective services.
