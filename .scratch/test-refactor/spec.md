# Frontend Test Suite Refactoring Specification

Status: ready-for-agent

## Problem Statement

The CareBase Angular frontend test suite currently achieves a 100% test pass rate across 19 test files (153 tests), yet it suffers from an architectural quality compliance score of only 47.6% due to pervasive test smells and legacy testing anti-patterns. 

Developers and maintainers encounter non-deterministic test behavior and maintenance friction caused by manual change detection calls (`fixture.detectChanges()`) in a zoneless Angular v22 environment, ad-hoc `setTimeout` sleep hacks in asynchronous data adapters, and direct mutations of private signals via `(component as any)` type escapes. Furthermore, critical user interactions and routing behaviors are decoupled from reality: router navigation is verified by spying on `router.navigate` instead of asserting genuine route transitions, internal collaborator services and resources are spied on with fragile call-count assertions (`toHaveBeenCalledWith`), and 5 core component suites contain only empty `it('should create')` smoke tests that leave essential workflows (such as database migrations, role-based navigation, and multi-step transaction dialogs) completely unverified. Lastly, tests rely on brittle internal DOM class selectors rather than official Angular CDK and Angular Material component harnesses, breaking whenever template markup is refactored.

## Solution

Execute a comprehensive, 4-phase architectural refactoring of the entire frontend test suite to bring it into 100% compliance with repository testing standards (ADR-0003 and modern Angular v22 zoneless testing guidelines):

1. **Eradicate Flakiness & Anti-Patterns**: Eliminate all manual `fixture.detectChanges()` invocations in favor of zoneless `await fixture.whenStable()`, replace arbitrary `setTimeout` sleep promises with deterministic `vi.waitFor` stabilization for reactive resources, and banish `(component as any)` private signal manipulations by supplying test data through public adapter contracts.
2. **Eliminate Router Spies & Collaborator Mocking**: Replace `vi.spyOn(router, 'navigate')` with `RouterTestingHarness` across landing and navigation components, test route protection guards through real navigation pipelines, and eliminate method spying on domain services by providing `InMemoryHospitalDataAdapter` via a standardized test provider.
3. **Elevate Shallow Suites to Behavioral Specifications**: Replace superficial `it('should create')` smoke tests with comprehensive behavioral specifications covering user workflows, dialog confirmation flows, and state machines.
4. **Modernize UI Testing with Component Harnesses & Purge Boilerplate**: Author a reusable `ActionCardHarness`, migrate all component DOM interactions to Angular Material and CDK component harnesses, and purge legacy Karma boilerplate (`compileComponents()`) and unused testing dependencies.

## User Stories

1. As a Frontend Maintainer, I want all component tests in the zoneless Angular application to rely exclusively on `await fixture.whenStable()`, so that test execution respects zoneless reactive scheduling and does not produce timing race conditions.
2. As a Frontend Maintainer, I want zero manual `fixture.detectChanges()` invocations in test files, so that synchronous change detection passes do not mask unresolved microtasks or break signal dependency graphs.
3. As a Frontend Maintainer, I want asynchronous reactive resource resolution in data adapters tested with deterministic `vi.waitFor` expectations rather than hardcoded `setTimeout` sleeps, so that test suites run as quickly as possible without flaking on busy CI runners.
4. As a Frontend Maintainer, I want private component signals protected from external test mutation, so that tests only interact with components through their public input, output, and template interfaces.
5. As a Frontend Maintainer, I want routing interactions in workstation landing pages tested using `RouterTestingHarness`, so that tests verify that destination routes, guards, and component activations genuinely succeed without mocking `Router`.
6. As a Frontend Maintainer, I want header layout role switching and sign-out actions tested against real URL state changes, so that navigation regressions are caught immediately.
7. As a Frontend Maintainer, I want role-based navigation guards verified within full routing harnesses rather than isolated functional execution contexts, so that unauthorized users are verifiably redirected to the home route.
8. As a Frontend Maintainer, I want domain workflow tests to execute against the hexagonal `InMemoryHospitalDataAdapter` rather than spying on collaborator service methods, so that tests verify observable business state transitions rather than internal call mechanics.
9. As a Frontend Maintainer, I want call-count assertions (`toHaveBeenCalledWith`) eliminated across component and workflow suites, so that internal service refactorings do not cause false test failures when external behavior remains unchanged.
10. As a Frontend Maintainer, I want a standardized dependency injection helper function for supplying the in-memory hospital data adapter, so that tests share an ergonomic, clean mechanism for state isolation.
11. As a Frontend Maintainer, I want each test spec execution to run with an isolated injector context, so that persistent test double state does not leak across test cases without requiring ad-hoc teardown methods.
12. As a Frontend Maintainer, I want tests using Angular Material dialogs or SVG charting libraries to configure `provideNoopAnimations()`, so that animation driver errors are eliminated without introducing timer flakiness.
13. As a Frontend Maintainer, I want legacy Karma-era `compileComponents()` calls purged from all test setup blocks, so that test configuration aligns with standalone Angular v22 and Vitest.
14. As a Frontend Maintainer, I want unused testing controllers and unreferenced test imports removed from specs, so that test code remains clean and free of dead weight.
15. As a Frontend Maintainer, I want an official `ActionCardHarness` created for the reusable action card component, so that parent components can interact with action cards through a resilient, encapsulated harness.
16. As a Frontend Maintainer, I want component tests to interact with buttons, steppers, tables, menus, and form controls exclusively through Angular Material harnesses, so that template CSS refactorings do not break tests.
17. As a Frontend Maintainer, I want brittle CSS class queries targeting private Material markup (`.mat-mdc-form-field-subscript-wrapper`) completely eradicated, so that tests remain resilient across Angular Material version upgrades.
18. As a Clerk, I want the multi-step Appointment intake wizard thoroughly tested from patient search to slot booking using component harnesses, so that appointment scheduling errors are prevented before deployment.
19. As a Clerk, I want concurrent Appointment booking collisions (HTTP 409) verified through the UI intake flow, so that conflict recovery and slot re-selection reliably guide me when conflicts occur.
20. As a Clerk, I want the Consultation Frequency Report verified to correctly render patient metrics and sorted consultation tables from hospital data, so that administrative insights are trustworthy.
21. As a Doctor, I want the treatment documentation workstation tested through its multi-step intake flow, so that recording clinical treatments and prescribed medications never regresses.
22. As a Doctor, I want the Treatment Expenditure Analytics report tested to load and display annual cost aggregations accurately, so that annual financial metrics are verified.
23. As a System Administrator, I want the admin portal tested to confirm database migration and seed actions via the transaction dialog, so that mission-critical database operations cannot be triggered inadvertently.
24. As a System Administrator, I want the asynchronous transaction dialog tested across its full lifecycle (`confirm` -> `loading` -> `success` / `error`), so that progress indicators and dismissal locking behave reliably.
25. As a Hospital Staff Member, I want the application shell verified to render top-level layout components and navigation outlets, so that UI framing is guaranteed across all personas.

## Implementation Decisions

1. **Four-Phase Sequential Migration Strategy**:
   - The refactoring will be executed in four strictly decoupled phases:
     - **Phase 1: Flakiness & Anti-Patterns**: Address zoneless stability, eliminate sleep hacks, and remove private signal writes.
     - **Phase 2: Router & Mock Elimination**: Replace router spies with `RouterTestingHarness`, adopt in-memory data adapter integration, and remove collaborator method mocks.
     - **Phase 3: Behavioral Depth for Shallow Suites**: Replace empty smoke tests with comprehensive user workflow and state machine tests.
     - **Phase 4: Component Harness Modernization & Boilerplate Cleanup**: Implement `ActionCardHarness`, migrate all DOM interactions to Material harnesses, and remove obsolete Karma code.

2. **Standardized Test Data Provider via Dependency Injection**:
   - Rather than mocking data access methods or inventing test-only reset APIs on adapter singletons, test suites will configure the hexagonal port to resolve to the in-memory adapter through a reusable helper. State isolation between tests is guaranteed by standard `TestBed` injector teardown per test.
   - Prototyped provider definition:
     ```typescript
     export function provideTestHospitalData(): Provider[] {
       return [{ provide: HOSPITAL_DATA_ACCESS, useClass: InMemoryHospitalDataAdapter }];
     }
     ```

3. **Deterministic Reactivity Stabilization for Signal Resources**:
   - To avoid flaky timeouts when waiting for Angular `ResourceRef` or asynchronous promises to settle in data adapter suites, tests will standardize on deterministic condition polling using Vitest's `vi.waitFor`.
   - Prototyped stabilization pattern:
     ```typescript
     await vi.waitFor(() => {
       expect(resource.value()).toBeDefined();
     });
     ```

4. **Dedicated Reusable Action Card Harness**:
   - A dedicated component harness will be created under the action card component directory extending `@angular/cdk/testing/ComponentHarness`.
   - The harness encapsulates interactions with the card title, description, button, and host click triggers, exposing asynchronous methods (`getTitleText()`, `clickActionButton()`, `clickCard()`) to insulate parent suites from action card internal templates.
   - Prototyped harness signature:
     ```typescript
     export class ActionCardHarness extends ComponentHarness {
       static hostSelector = 'app-action-card';
       async getTitle(): Promise<string>;
       async getDescription(): Promise<string>;
       async clickActionButton(): Promise<void>;
     }
     ```

5. **Noop Animation Standardization for Dialog and Chart Suites**:
   - For all test suites involving Angular Material dialogs or SVG chart rendering libraries, configure `provideNoopAnimations()` in the test module providers to ensure animation drivers are satisfied without creating timer delays or open microtasks.

6. **Router Testing Harness Adoption**:
   - Route and guard specifications will declare stub routes and navigate using `RouterTestingHarness.create()`.
   - Assertions will inspect `router.url` and active component instances rather than verifying arguments passed to `router.navigate`.

7. **Tracking and Milestone Dashboard**:
   - Refactoring progress and compliance scores will be tracked under the project's issue tracker directory structure, maintaining a central index dashboard and per-phase tracking documents.

## Testing Decisions

1. **What Makes a Good Test in This Suite**:
   - **Observable Behavior over Implementation Details**: Tests must interact through public component templates (via harnesses), routing URLs (via `RouterTestingHarness`), and public service interfaces. Tests must never inspect private fields, spy on internal service method calls, or assert call counts (`toHaveBeenCalledWith`).
   - **Resilience to Internal Refactoring**: Rewriting a component's internal state management from RxJS to Signals, changing internal CSS class names, or modifying collaborator service method signatures must not break component tests as long as external behavior and user interactions remain unchanged.
   - **Deterministic & Async-First**: Every asynchronous state update must be awaited using `await fixture.whenStable()` or `vi.waitFor`. Zero `fixture.detectChanges()` and zero `setTimeout` delays.

2. **Modules Under Test**:
   - **Application Root**: App shell component.
   - **Navigation & Layout**: Header layout component, landing portal page, role guard.
   - **Reusable Components**: Action card component and action card harness.
   - **Administrative Portal**: Admin page, asynchronous transaction dialog.
   - **Clerk Operations**: Clerk portal hub, multi-step appointment intake wizard, appointment intake workflow service, consultation frequency report.
   - **Doctor Operations**: Doctor workstation portal hub, treatment documentation wizard, treatment expenditure report.
   - **Data Access & Services**: HTTP hospital data adapter, in-memory hospital data adapter, hospital data access port, clerk domain service, actor session service.

3. **Testing Seams**:
   - **Seam 1 (Primary UI Seam)**: Angular Material & CDK Component Harnesses (`TestbedHarnessEnvironment`, `MatButtonHarness`, `MatStepperHarness`, `MatTableHarness`, `MatSortHarness`, `MatMenuHarness`, `ActionCardHarness`). Catches template binding defects, form control errors, user interaction failures, and DOM state mismatches.
   - **Seam 2 (Routing Seam)**: `RouterTestingHarness`. Catches route configuration errors, guard redirection logic, missing route parameters, and URL synchronization failures.
   - **Seam 3 (Persistence & Integration Seam)**: `HOSPITAL_DATA_ACCESS` port bound to `InMemoryHospitalDataAdapter` via `provideTestHospitalData()`. Catches business logic errors, slot collision handling, state persistence, and reactive data fetching.

4. **Prior Art in the Codebase**:
   - `src/app/services/actor-session.spec.ts`: Exemplary behavioral test suite testing public methods, real `sessionStorage` hydration, and corrupted state handling without mocking.
   - `src/app/services/hospital-data-access.spec.ts`: Clean verification of domain error hierarchy and injection token identities.

## Out of Scope

- **Backend API Implementation**: No changes to Python/Flask backend routes, database migrations, or SQL/MongoDB schemas.
- **Production UI Redesign**: No alterations to the visual appearance, styling tokens, fonts, or layout of the Angular frontend.
- **Production Domain Refactoring**: Production components will not be modified unless a genuine functional bug is uncovered during test refactoring.
- **End-to-End Browser Testing**: Playwright or Cypress end-to-end testing across browser binaries is tracked separately from unit/component testing.
- **New Feature Development**: No additions of new clinical or administrative capabilities beyond existing specifications.

## Further Notes

- **Ubiquitous Language Compliance**: All specifications and test titles strictly follow `GLOSSARY.md` definitions (`Doctor`, `Clerk`, `Patient`, `Department`, `Appointment`, `Time Slot`, `Treatment`, `Medication`, `SSN`, `NACA Score`, `Consultation Frequency Report`).
- **Architectural Standards Compliance**: Directly implements the mandates established in ADR-0003 (`Frontend Testing Standards and Harnesses`).
- **Execution Tracking**: The rollout across all 19 test files will be tracked in detail via milestone tracking documents under `.scratch/test-refactor/`.
