# Comprehensive Frontend Test Suite Quality Audit
**Target Codebase:** `frontend/carebase-frontend/src/app/**/*.spec.ts` (Angular v22, Vitest v4.1.11, Zoneless)  
**Evaluator:** Code Quality & Testing Standards Auditor  
**Date:** October 2026  
**Audited Files:** 19 test files (153 tests total)

---

## 1. Executive Summary & Compliance Scorecard

### 1.1 Executive Summary
A comprehensive audit of all 19 test specifications within the CareBase Angular frontend was conducted against the repository's core testing standards:
1. **Behavioral TDD Standards** (`.agents/skills/tdd/tests.md`): Behavior over implementation, public API interaction, survival under refactoring, prohibition of collaborator mocking and call count asserting.
2. **Modern Angular & Vitest Guidelines** (`.agent/skills/angular-developer/`): Zoneless change detection (`await fixture.whenStable()`, zero `fixture.detectChanges()`), component harnesses (`TestbedHarnessEnvironment`), and real routing tests (`RouterTestingHarness`).

While **100% of the tests currently pass (153/153)**, the test suite exhibits substantial architectural divergence from the repository's published standards:
- **Zoneless Protocol Violation:** `fixture.detectChanges()` is invoked **33+ times** across component tests (notably `clerk-use-case.spec.ts`), in direct violation of the async-first zoneless standard.
- **Component Harness Absence:** Angular Material component harnesses (`MatButtonHarness`, `MatStepperHarness`, `MatTableHarness`, `MatSelectHarness`) are **100% absent** from all 19 files. Tests rely on brittle CSS query selectors (e.g. `.action-btn`, `.step-actions`, `.mat-mdc-form-field-subscript-wrapper`) or completely bypass the DOM.
- **Router Mocking:** Router navigation is tested by spying on `router.navigate` (`vi.spyOn(router, 'navigate')`) rather than using `RouterTestingHarness`.
- **Collaborator Spying & Implementation Coupling:** Internal services and resources are spied on and verified via `toHaveBeenCalledWith` rather than testing observable outcomes. Private signals are directly mutated using TypeScript escapes (`(component as any).reportDataSignal.set(...)`).
- **Superficial "Should Create" Tests:** 5 component test files (`app.spec.ts`, `admin-page.spec.ts`, `clerk-page.spec.ts`, `doctor-page.spec.ts`, `transaction-dialog.spec.ts`) contain **only** a single `it('should create')` assertion, leaving entire user workflows completely untested.
- **Non-Deterministic Sleep Hacks:** Four test files rely on ad-hoc `setTimeout` promise sleeps (`const settle = () => new Promise(r => setTimeout(r, 10 | 20))`) instead of deterministic Vitest fake timers or signal stability.

### 1.2 Compliance Scorecard

| # | Test File | Tests | Pass | Score | Status | Primary Violations |
|---|---|:---:|:---:|:---:|:---:|---|
| 1 | `src/app/app.spec.ts` | 1 | 1 | 15% | 🔴 Critical | Scaffold only, legacy `compileComponents()`, missing `whenStable()` |
| 2 | `src/app/action-card/action-card.spec.ts` | 4 | 4 | 50% | 🟡 Moderate | Brittle DOM queries, missing harnesses, output spy instead of host integration |
| 3 | `src/app/admin-page/admin-page.spec.ts` | 1 | 1 | 10% | 🔴 Critical | Scaffold only (`should create`), dialog and migration triggers untested |
| 4 | `src/app/clerk-page/clerk-page.spec.ts` | 1 | 1 | 10% | 🔴 Critical | Scaffold only (`should create`), portal navigation untested, unused import |
| 5 | `src/app/clerk-report/clerk-report.spec.ts` | 11 | 11 | 25% | 🔴 Severe | Private property mutation `(component as any)`, resource spying, no UI interaction |
| 6 | `src/app/clerk-use-case/appointment-intake-workflow.spec.ts` | 21 | 21 | 60% | 🟡 Moderate | Spying on collaborator `clerkService.bookAppointment`, spying on internal resource |
| 7 | `src/app/clerk-use-case/clerk-use-case.spec.ts` | 35 | 35 | 20% | 🔴 Severe | 33+ `fixture.detectChanges()`, brittle DOM queries, collaborator mocks, manual stepper mutation |
| 8 | `src/app/doctor-page/doctor-page.spec.ts` | 1 | 1 | 10% | 🔴 Critical | Scaffold only (`should create`), clinical actions and navigation untested |
| 9 | `src/app/doctor-report/doctor-report.spec.ts` | 2 | 2 | 25% | 🔴 Severe | Hardcoded `setTimeout(20)` sleep hack, zero template/chart testing, unused import |
| 10 | `src/app/doctor-use-case/doctor-use-case.spec.ts` | 4 | 4 | 25% | 🔴 Severe | Hardcoded `setTimeout(20)` sleep hack, signal setting bypasses UI, mocked stepper, unused vars |
| 11 | `src/app/guards/role-guard.spec.ts` | 14 | 14 | 65% | 🟡 Moderate | Direct function invocation in injection context instead of `RouterTestingHarness`, unused `Router` |
| 12 | `src/app/header-layout/header-layout.spec.ts` | 2 | 2 | 20% | 🔴 Severe | Mocked collaborators (`ActorSession`, `AdminService`), mocked `router.navigate`, zero UI testing |
| 13 | `src/app/landing-page/landing-page.spec.ts` | 4 | 4 | 25% | 🔴 Severe | Mocked `router.navigate`, component methods called directly, zero card interaction, unused HTTP testing |
| 14 | `src/app/services/actor-session.spec.ts` | 14 | 14 | 95% | 🟢 Compliant | Pure observable behavior, tests real `sessionStorage`, handles corruption/errors |
| 15 | `src/app/services/clerk-service.spec.ts` | 4 | 4 | 70% | 🟡 Moderate | Superficial `.toBeTruthy()` resource assertions, false rehydration test (same singleton) |
| 16 | `src/app/services/hospital-data-access.spec.ts` | 5 | 5 | 100% | 🟢 Compliant | Clean domain error inheritance and token verification |
| 17 | `src/app/services/http-hospital-data-adapter.spec.ts` | 16 | 16 | 85% | 🟢 High | Excellent HTTP contract testing; minor smell: `setTimeout(10)` sleep helper |
| 18 | `src/app/services/in-memory-hospital-data-adapter.spec.ts` | 12 | 12 | 85% | 🟢 High | Excellent real-interface test; minor smell: `setTimeout(10)` sleep helper |
| 19 | `src/app/transaction-dialog/transaction-dialog.spec.ts` | 1 | 1 | 10% | 🔴 Critical | Scaffold only (`should create`), async state machine, progress bar, error handling untested |

**Overall Suite Compliance Average:** **47.6%**

---

## 2. Taxonomy of Test Smells Identified

### Smell 1: Manual Change Detection in Zoneless Angular (`fixture.detectChanges()`)
- **Definition:** Calling `fixture.detectChanges()` manually inside test blocks.
- **Standard Reference:** `.agent/skills/angular-developer/references/testing-fundamentals.md` ("*Core Philosophy: Zoneless & Async-First... Do NOT use `fixture.detectChanges()` to manually trigger updates. ALWAYS use the 'Act, Wait, Assert' pattern with `await fixture.whenStable()`*").
- **Rationale:** Angular v22 in this application operates zoneless. State updates schedule asynchronous rendering tasks. Calling `detectChanges()` forces an immediate synchronous cycle that interferes with signal dependency graphs, hides timing issues, and bypasses pending microtasks.
- **Prevalence:** 33+ calls in `clerk-use-case.spec.ts`, 1 call in `header-layout.spec.ts`.

### Smell 2: Brittle DOM Queries & Missing Component Harnesses
- **Definition:** Querying elements via `fixture.nativeElement.querySelector(...)`, CSS class names (`.action-btn`, `.step-actions`, `.selected-entity-card`), or Material internal markup (`.mat-mdc-form-field-subscript-wrapper`).
- **Standard Reference:** `.agent/skills/angular-developer/references/component-harnesses.md` ("*Component harnesses are the standard, preferred way to interact with components in tests... Tests don't break when you refactor a component's internal HTML or CSS classes... Angular Material provides a test harness for every component in its library*").
- **Rationale:** CSS class selectors couple tests to transient markup decisions. Component harnesses (`MatButtonHarness`, `MatStepperHarness`, `MatInputHarness`) provide an official, resilient interaction API that mimics real user behavior and handles asynchronous change detection automatically.
- **Prevalence:** Highly prevalent in `clerk-use-case.spec.ts` and `action-card.spec.ts`. Completely absent in other component tests where DOM testing was omitted entirely.

### Smell 3: Router Mocking & Non-Harness Route Navigation
- **Definition:** Mocking the router via `vi.spyOn(router, 'navigate')` and verifying routing with `expect(router.navigate).toHaveBeenCalledWith(...)`, or testing guards exclusively in isolated injection contexts without route configurations.
- **Standard Reference:** `.agent/skills/angular-developer/references/router-testing.md` ("*When testing components that involve routing, it is crucial not to mock the Router or related services. Instead, use the `RouterTestingHarness`... Using the harness ensures you are testing the actual router configuration, guards, and resolvers*").
- **Rationale:** Mocking `router.navigate` verifies only that a specific internal method was called. It fails to verify that the route actually exists, that guards permit entry, that resolvers provide required data, or that the destination component activates.
- **Prevalence:** `header-layout.spec.ts`, `landing-page.spec.ts`, `role-guard.spec.ts`.

### Smell 4: Collaborator Spying & Call-Count Assertions (`toHaveBeenCalledWith`)
- **Definition:** Spying on services or resources using `vi.spyOn` and asserting call counts or parameter payloads (`expect(spy).toHaveBeenCalledWith(...)`, `expect(reloadSpy).toHaveBeenCalled()`).
- **Standard Reference:** `.agents/skills/tdd/tests.md` ("*Bad Tests: Mocking internal collaborators, asserting on call counts/order, breaking on refactoring without behavior change. Good Tests: Test through real interfaces, not mocks of internal parts... One logical assertion per test*").
- **Rationale:** Tests become tightly bound to the internal wiring of the system under test. Refactoring a collaborator from an RxJS method call to a signal resource breaks the test even if the observable behavior is identical.
- **Prevalence:** `appointment-intake-workflow.spec.ts`, `clerk-use-case.spec.ts`, `clerk-report.spec.ts`, `header-layout.spec.ts`.

### Smell 5: Bypassing Public API & UI Surfaces (Direct Signal Mutation & Private Escapes)
- **Definition:** Directly mutating component state or internal signals (`(component as any).reportDataSignal.set(...)`, `component.startDate.set(...)`, `stepper.selectedIndex = 1`, `component.searchQuery.set(...)`) instead of performing user actions (typing into input fields, clicking buttons, selecting dates).
- **Standard Reference:** `.agents/skills/tdd/tests.md` ("*Bad Tests: Testing private methods, verifying through external means instead of interface. Good Tests: Uses public API only, tests behavior users/callers care about*").
- **Rationale:** When tests bypass the UI and mutate internal variables directly, they only test that TypeScript variables hold values. They fail to test event bindings, input parsing, formatting pipes, or accessibility semantics.
- **Prevalence:** `clerk-report.spec.ts` (multiple `(component as any)` escapes), `doctor-use-case.spec.ts`, `doctor-report.spec.ts`, `header-layout.spec.ts`, `landing-page.spec.ts`.

### Smell 6: Non-Deterministic Sleep/Settle Hacks (`setTimeout`)
- **Definition:** Using `const settle = () => new Promise((r) => setTimeout(r, 10 | 20));` to pause test execution until asynchronous operations finish.
- **Standard Reference:** `.agent/skills/angular-developer/references/testing-fundamentals.md` and Vitest timing principles.
- **Rationale:** Hardcoded timer delays create non-deterministic test suites that are prone to race conditions on overloaded CI runners and slow down test execution. Proper asynchronous testing relies on `await fixture.whenStable()`, `TestBed.tick()`, or Vitest fake timers (`vi.useFakeTimers()`).
- **Prevalence:** `doctor-report.spec.ts`, `doctor-use-case.spec.ts`, `http-hospital-data-adapter.spec.ts`, `in-memory-hospital-data-adapter.spec.ts`.

### Smell 7: Superficial "Should Create" Smoke Tests
- **Definition:** Test suites that only assert `expect(component).toBeTruthy()` and test no actual user behavior, state transitions, or business rules.
- **Standard Reference:** `.agents/skills/tdd/tests.md` ("*Good Tests: Tests observable behavior, tests behavior users/callers care about, survives internal refactors*").
- **Rationale:** A test that only verifies component instantiation provides virtually zero defect protection. Critical UI workflows, validation constraints, and error states remain completely uncovered.
- **Prevalence:** `app.spec.ts`, `admin-page.spec.ts`, `clerk-page.spec.ts`, `doctor-page.spec.ts`, `transaction-dialog.spec.ts`.

### Smell 8: Dead Code, Unused Injections & Obsolete Boilerplate
- **Definition:** Leaving unused imports, unused injected variables (`HttpTestingController`, `Router`, `provideAnimationsAsync`), or obsolete karma-era calls like `compileComponents()`.
- **Standard Reference:** Modern Angular 22 & Vitest standards.
- **Rationale:** Clutters test files, causes confusion regarding what the test actually depends on, and introduces maintenance overhead.
- **Prevalence:** `app.spec.ts`, `landing-page.spec.ts`, `role-guard.spec.ts`, `doctor-report.spec.ts`, `doctor-use-case.spec.ts`, `clerk-page.spec.ts`.

### Smell 9: Inverted Integration: Mocking Instead of Leveraging In-Memory Architecture
- **Definition:** Mocking data access methods when a complete, working `InMemoryHospitalDataAdapter` already exists and is provided in the test module.
- **Standard Reference:** `.agents/skills/tdd/tests.md` ("*Integration-style: Test through real interfaces, not mocks of internal parts*").
- **Rationale:** CareBase was intentionally designed with a dual-adapter hexagonal architecture (`HospitalDataAccess` port with `HttpHospitalDataAdapter` and `InMemoryHospitalDataAdapter`). Mocking the port methods in component tests throws away the exact high-fidelity test double designed for this purpose.
- **Prevalence:** `clerk-use-case.spec.ts`, `appointment-intake-workflow.spec.ts`.

---

## 3. File-by-File Detailed Audit

---

### File 1: `frontend/carebase-frontend/src/app/app.spec.ts`
- **Role:** Application Root Component Spec
- **Tests / Passing:** 1 / 1
- **Compliance Score:** 15% (🔴 Critical)

#### Smells Identified & Code Citations
1. **Smell 8 (Obsolete Karma Boilerplate):** Lines 7–10 invoke `compileComponents()`.
   ```typescript
   // Lines 6-11
   beforeEach(async () => {
     await TestBed.configureTestingModule({
       imports: [App],
       providers: [provideRouter([])],
     }).compileComponents(); // <-- Redundant in Vitest + standalone Angular
   });
   ```
2. **Smell 7 (Superficial Smoke Test):** Lines 13–17 only test component truthiness.
   ```typescript
   // Lines 13-17
   it('should create the app', () => {
     const fixture = TestBed.createComponent(App);
     const app = fixture.componentInstance;
     expect(app).toBeTruthy();
   });
   ```
3. **Smell 1 (Missing Stability Wait):** No `await fixture.whenStable()` called after component creation.

#### Violation Analysis
- `tests.md`: Fails "Tests observable behavior". The test asserts nothing about what the app renders (header layout, router outlet).
- `testing-fundamentals.md`: Omits `await fixture.whenStable()`. In standalone Angular running on Vitest/Vite, `compileComponents()` is synchronous and completely unnecessary.

#### Recommended Refactoring
Replace `compileComponents()` with zoneless `await fixture.whenStable()`. Verify that `<app-header-layout>` or the router outlet is rendered in the root DOM.
```typescript
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    });
  });

  it('renders application shell with header layout', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const headerLayout = fixture.nativeElement.querySelector('app-header-layout');
    expect(headerLayout).toBeTruthy();
  });
});
```

---

### File 2: `frontend/carebase-frontend/src/app/action-card/action-card.spec.ts`
- **Role:** Reusable Action Card Component Spec
- **Tests / Passing:** 4 / 4
- **Compliance Score:** 50% (🟡 Moderate)

#### Smells Identified & Code Citations
1. **Smell 2 (Brittle DOM Query Selectors):** Lines 24, 34, 44 use raw CSS class queries instead of component harnesses.
   ```typescript
   // Line 24
   const button = fixture.nativeElement.querySelector('.action-btn') as HTMLButtonElement;
   button.click();
   // Line 34
   const card = fixture.nativeElement.querySelector('.action-card') as HTMLElement;
   card.click();
   ```
2. **Smell 1 (Missing Stability Wait After User Actions):** Lines 25–27, 35–37, 46–48 execute clicks and assert synchronously without `await fixture.whenStable()`.
3. **Smell 5 (Direct Output Subscription Inspection):** Lines 21–22, 31–32 subscribe to the component's output directly rather than testing interaction in a host context.
4. **Smell 7 (Scaffold Smoke Test):** Line 16: `it('should create')`.

#### Violation Analysis
- `component-harnesses.md`: `ActionCard` wraps `MatCard` and `MatButton`. Using `.action-btn` and `.action-card` classes couples tests to template implementation details. If the button style or class changes, the tests break.
- `testing-fundamentals.md`: Act, Wait (`await fixture.whenStable()`), Assert must follow all UI actions.

#### Recommended Refactoring
Use `TestbedHarnessEnvironment` and `MatButtonHarness`.
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { ActionCard } from './action-card';

describe('ActionCard', () => {
  let fixture: ComponentFixture<ActionCard>;
  let component: ActionCard;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ActionCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Test Action');
    fixture.componentRef.setInput('buttonText', 'Execute');
    await fixture.whenStable();
  });

  it('emits actionClicked when the action button is clicked via harness', async () => {
    let emitted = 0;
    component.actionClicked.subscribe(() => emitted++);

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Execute' }));
    await button.click();

    expect(emitted).toBe(1);
  });
});
```

---

### File 3: `frontend/carebase-frontend/src/app/admin-page/admin-page.spec.ts`
- **Role:** Administrator Dashboard Spec
- **Tests / Passing:** 1 / 1
- **Compliance Score:** 10% (🔴 Critical)

#### Smells Identified & Code Citations
1. **Smell 7 (Superficial Smoke Test):** Entire test suite consists of 18 lines with a single `it('should create')`.
   ```typescript
   // Lines 14-16
   it('should create', () => {
     expect(component).toBeTruthy();
   });
   ```
2. **Smell 1 (Missing Stability Wait):** `beforeEach` on line 9 creates component but never awaits `fixture.whenStable()`.
3. **Smell 8 (Unused Provider Import):** Line 2 imports `provideHttpClient` but doesn't provide it in `TestBed.configureTestingModule` (relies on default DI, which causes unhandled dependencies if `AdminService` is constructed).

#### Violation Analysis
- `tests.md`: Fails "Tests behavior users/callers care about". `AdminPage` provides two core user actions: `migrateDb()` and `seedDb()`. Both open `TransactionDialog` using `MatDialog`. The test suite covers 0% of this behavior.

#### Recommended Refactoring
Test that clicking the Seed and Migration action cards opens the `TransactionDialog` with the appropriate parameters.
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { AdminPage } from './admin-page';
import { AdminService } from '../services/admin-service';
import { of } from 'rxjs';

describe('AdminPage', () => {
  let fixture: ComponentFixture<AdminPage>;
  let component: AdminPage;
  let dialog: MatDialog;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AdminPage],
      providers: [
        {
          provide: AdminService,
          useValue: {
            migrateDatabase: () => of({ success: true }),
            seedDatabase: () => of({ success: true }),
          },
        },
      ],
    });
    dialog = TestBed.inject(MatDialog);
    fixture = TestBed.createComponent(AdminPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('opens confirmation dialog when initiating database migration', async () => {
    const dialogSpy = vi.spyOn(dialog, 'open');
    component.migrateDb();
    expect(dialogSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: expect.objectContaining({ title: 'Migrate Database to MongoDB' }),
      }),
    );
  });
});
```

---

### File 4: `frontend/carebase-frontend/src/app/clerk-page/clerk-page.spec.ts`
- **Role:** Clerk Portal Hub Spec
- **Tests / Passing:** 1 / 1
- **Compliance Score:** 10% (🔴 Critical)

#### Smells Identified & Code Citations
1. **Smell 7 (Superficial Smoke Test):** Lines 14–16 only test `expect(component).toBeTruthy()`.
2. **Smell 8 (Unused Imports):** Line 3 imports `provideRouter`, but it is omitted from `TestBed.configureTestingModule`.
3. **Smell 1 (Missing Stability Wait):** Omits `await fixture.whenStable()`.

#### Violation Analysis
- `tests.md`: Fails "Tests observable behavior". `ClerkPage` renders two action cards: "Schedule Appointment" (navigates to intake) and "Visit Frequency Analytics" (navigates to report). None of this is verified.

#### Recommended Refactoring
Use `RouterTestingHarness` to verify navigation to intake and report pages.
```typescript
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ClerkPage } from './clerk-page';
import { Component } from '@angular/core';

@Component({ template: '' }) class DummyComponent {}

describe('ClerkPage Navigation', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'clerk', component: ClerkPage },
          { path: 'clerk/intake', component: DummyComponent },
          { path: 'clerk/reports', component: DummyComponent },
        ]),
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  it('navigates to appointment intake when clicking Schedule Appointment', async () => {
    const clerkPage = await harness.navigateByUrl('/clerk', ClerkPage);
    clerkPage.toUseCase();
    await harness.fixture.whenStable();

    const router = TestBed.inject(Router);
    expect(router.url).toBe('/clerk/intake');
  });
});
```

---

### File 5: `frontend/carebase-frontend/src/app/clerk-report/clerk-report.spec.ts`
- **Role:** Clerk Consultation Frequency Report Spec
- **Tests / Passing:** 11 / 11
- **Compliance Score:** 25% (🔴 Severe)

#### Smells Identified & Code Citations
1. **Smell 5 (Direct Mutation of Private Signal via TypeScript Escape):** Lines 76, 84, 97, 112, 144 use `(component as any).reportDataSignal.set(...)` to inject test data into a private internal signal.
   ```typescript
   // Line 76
   (component as any).reportDataSignal.set(mockRecords);
   expect(component.totalUniquePatients()).toBe(3);
   ```
2. **Smell 4 (Collaborator Spying & Call Counting):** Lines 130–134 and 137–141 spy on the component's internal resource and assert it was called.
   ```typescript
   // Lines 130-134
   const reloadSpy = vi.spyOn(component.reportResource, 'reload').mockReturnValue(true);
   component.onGenerateReport();
   expect(reloadSpy).toHaveBeenCalled();
   ```
3. **Smell 5 (Bypassing Template / UI):** Tests directly invoke `component.onSortChange(...)`, `component.startDate.set(...)`, and assert on internal signals without testing whether the rendered table displays the rows or updates sort indicators.
4. **Smell 2 (Zero Component Harnesses):** No harnesses used despite the component featuring `MatTable`, `MatSort`, `MatDatepicker`, and `MatFormField`.

#### Violation Analysis
- `tests.md`: Direct violation of "Testing private methods", "Mocking internal collaborators", and "Bypasses interface to verify". Bypassing the public interface to mutate `reportDataSignal` directly couples tests to private implementation details.
- `component-harnesses.md`: Table sorting and date filtering should be tested via `MatSortHarness`, `MatTableHarness`, and `MatInputHarness`.

#### Recommended Refactoring
Provide the test data through the configured `InMemoryHospitalDataAdapter` (which is already provided on line 50!) and interact with the UI through component harnesses.
```typescript
it('displays calculated KPIs and filtered table data from hospital data adapter', async () => {
  const dataAccess = TestBed.inject(HOSPITAL_DATA_ACCESS) as InMemoryHospitalDataAdapter;
  // Seed visit records into dataAccess or let it return test records
  component.startDate.set('2026-01-01');
  component.endDate.set('2026-12-31');
  await fixture.whenStable();

  const loader = TestbedHarnessEnvironment.loader(fixture);
  const table = await loader.getHarness(MatTableHarness);
  const rows = await table.getRows();
  expect(rows.length).toBeGreaterThan(0);
});
```

---

### File 6: `frontend/carebase-frontend/src/app/clerk-use-case/appointment-intake-workflow.spec.ts`
- **Role:** Appointment Intake Domain Workflow Spec
- **Tests / Passing:** 21 / 21
- **Compliance Score:** 60% (🟡 Moderate)

#### Smells Identified & Code Citations
1. **Smell 4 (Collaborator Spying & Call Counting):** Lines 211, 225, 229–256, 260, 283 spy on `clerkService.bookAppointment` and assert `toHaveBeenCalledWith(...)`.
   ```typescript
   // Lines 229-252
   const bookSpy = vi.spyOn(clerkService, 'bookAppointment').mockReturnValue(
     of({ success: true, appointmentId: 42, message: '...' })
   );
   // ...
   const result = await workflow.submit();
   expect(bookSpy).toHaveBeenCalledWith({
     patientSsn: '2041',
     doctorSsn: '3011',
     date: '2026-10-15',
     time: '09:00',
     reason: 'Routine checkup',
     clerkSsn: '1001',
   });
   ```
2. **Smell 4 (Resource Property Spying):** Lines 266–277 spy on the internal resource `workflow.timeSlotsResource.reload`.
   ```typescript
   // Line 266
   const reloadSpy = vi.spyOn(workflow.timeSlotsResource, 'reload').mockReturnValue(true);
   // ...
   expect(reloadSpy).toHaveBeenCalled();
   ```
3. **Smell 9 (Mocking Instead of Real Adapter Integration):** Line 45 configures `InMemoryHospitalDataAdapter`, but tests mock `clerkService.bookAppointment` rather than letting the in-memory adapter perform the real booking.

#### Violation Analysis
- `tests.md`: Violates "Mocking internal collaborators" and "Asserting on call counts/order (`toHaveBeenCalledWith`)". The workflow's job is to manage appointment submission. If `InMemoryHospitalDataAdapter` is used, the submission can execute against the real in-memory store and assert that the appointment is genuinely created and retrievable.

#### Recommended Refactoring
Allow `ClerkService` to execute against `InMemoryHospitalDataAdapter`. Test that `submit()` returns `{ status: 'success', appointmentId }` and that the slot is subsequently marked unavailable in the data store.
```typescript
it('successfully submits appointment booking through in-memory store', async () => {
  workflow.selectPatient(mockPatient);
  workflow.selectDoctor(mockCardioDoc);
  workflow.selectDate(new Date(2026, 9, 15));
  workflow.selectTimeSlot('09:00');
  workflow.setReason('Routine checkup');

  const result = await workflow.submit();

  expect(result.status).toBe('success');
  expect(workflow.bookingSuccess()).toBe(true);
  expect(workflow.createdAppointmentId()).toBeDefined();
});
```

---

### File 7: `frontend/carebase-frontend/src/app/clerk-use-case/clerk-use-case.spec.ts`
- **Role:** Multi-Step Clerk Intake Wizard Spec
- **Tests / Passing:** 35 / 35
- **Compliance Score:** 20% (🔴 Severe)

#### Smells Identified & Code Citations
1. **Smell 1 (Massive Overuse of `fixture.detectChanges()`):** Called **33+ times** across the file (lines 276, 295, 297, 318, 320, 345, 347, 363, 365, 371, 386, 399, 407, 417, 446, 448, 473, 475, 487, 504, 506, 517, 541, 546, 555, 562, 573, 584, 592, 601, 620, 634, 643).
   ```typescript
   // Lines 295-298
   fixture.detectChanges();
   stepper.selectedIndex = 1;
   fixture.detectChanges();
   await fixture.whenStable();
   ```
2. **Smell 2 (Brittle DOM Query Selectors):**
   - Lines 279, 411: `fixture.nativeElement.querySelector('.selected-entity-card')`
   - Lines 301, 324: `fixture.nativeElement.querySelector('.clinical-summary-strip')`
   - Lines 394, 427: `step1Actions.querySelector('button[matStepperNext]') as HTMLButtonElement`
   - Lines 451, 478: `fixture.nativeElement.querySelector('.no-slots-banner')`
   - Line 579: `formField.querySelector('.mat-mdc-form-field-subscript-wrapper')` (Material private CSS class!)
3. **Smell 4 & 9 (Collaborator Mocking over Real Adapter):**
   ```typescript
   // Lines 69-83
   vi.spyOn(dataAccess, 'getDoctors').mockReturnValue({ ... } as any);
   vi.spyOn(dataAccess, 'getTimeSlots').mockReturnValue({ ... } as any);
   ```
4. **Smell 5 (Manual Stepper State Mutation):** Lines 296, 319, 346, 447 mutate `stepper.selectedIndex` directly instead of advancing steps through the stepper UI or harness.

#### Violation Analysis
- `testing-fundamentals.md`: "Do NOT use `fixture.detectChanges()` to manually trigger updates. ALWAYS use the 'Act, Wait, Assert' pattern: `await fixture.whenStable()`".
- `component-harnesses.md`: Violates harness guidelines. `MatStepperHarness`, `MatButtonHarness`, and `MatInputHarness` should be used instead of manual property mutation and fragile CSS class selectors.
- `tests.md`: Violates "Integration-style: Test through real interfaces". Stubs out `getDoctors` and `getTimeSlots` even though `InMemoryHospitalDataAdapter` is already in the DI tree.

#### Recommended Refactoring
Replace `fixture.detectChanges()` with `await fixture.whenStable()`. Replace `stepper.selectedIndex = N` and manual DOM queries with `MatStepperHarness`.
```typescript
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatStepperHarness } from '@angular/material/stepper/testing';
import { MatButtonHarness } from '@angular/material/button/testing';

it('advances through stepper intake workflow using harnesses', async () => {
  const loader = TestbedHarnessEnvironment.loader(fixture);
  const stepper = await loader.getHarness(MatStepperHarness);

  component.selectPatient(mockPatient);
  await fixture.whenStable();

  const nextBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Next' }));
  await nextBtn.click();
  await fixture.whenStable();

  const steps = await stepper.getSteps();
  expect(await steps[1].isSelected()).toBe(true);
});
```

---

### File 8: `frontend/carebase-frontend/src/app/doctor-page/doctor-page.spec.ts`
- **Role:** Doctor Workstation Portal Spec
- **Tests / Passing:** 1 / 1
- **Compliance Score:** 10% (🔴 Critical)

#### Smells Identified & Code Citations
1. **Smell 7 (Superficial Smoke Test):** Lines 19–21 only test `expect(component).toBeTruthy()`.
2. **Smell 1 (Missing Stability Wait):** `beforeEach` omits `await fixture.whenStable()`.

#### Violation Analysis
- `tests.md`: Fails "Tests observable behavior". `DoctorPage` hosts two entry points: "Document Treatment" and "Treatment Expenditure Analytics". Navigation and card triggering are completely unverified.

#### Recommended Refactoring
Use `RouterTestingHarness` to verify navigation to treatment intake and cost report routes.
```typescript
it('navigates to treatment documentation when clicking Document Treatment card', async () => {
  const harness = await RouterTestingHarness.create();
  const page = await harness.navigateByUrl('/doctor', DoctorPage);
  page.toUseCase();
  await harness.fixture.whenStable();

  const router = TestBed.inject(Router);
  expect(router.url).toBe('/doctor/treatment');
});
```

---

### File 9: `frontend/carebase-frontend/src/app/doctor-report/doctor-report.spec.ts`
- **Role:** Doctor Treatment Expenditure Report Spec
- **Tests / Passing:** 2 / 2
- **Compliance Score:** 25% (🔴 Severe)

#### Smells Identified & Code Citations
1. **Smell 6 (Hardcoded Sleep Hack):** Line 11 defines `settle = () => new Promise((r) => setTimeout(r, 20))` and line 30 awaits it.
   ```typescript
   // Lines 11, 29-32
   const settle = () => new Promise((r) => setTimeout(r, 20));
   // ...
   component.selectedYear.set(2026);
   await settle();
   await fixture.whenStable();
   ```
2. **Smell 7 (Superficial Suite):** Only 2 tests for a rich analytics reporting component.
3. **Smell 5 (Bypassing UI):** Directly sets `component.selectedYear.set(2026)` without testing the year selector UI or verifying rendered tables/charts.
4. **Smell 8 (Unused Import):** Line 2 imports `provideAnimationsAsync` which is unused.

#### Violation Analysis
- `testing-fundamentals.md`: Using `setTimeout(20)` introduces non-deterministic waits and race conditions. State updates in zoneless Angular should settle via `await fixture.whenStable()`.
- `tests.md`: Does not test observable UI behavior (charts, totals, breakdowns).

#### Recommended Refactoring
Remove `settle()`. Use `await fixture.whenStable()` and test the rendered report table or summary metrics.
```typescript
it('loads and renders doctor earnings report for selected year', async () => {
  component.selectedYear.set(2026);
  await fixture.whenStable();

  const table = fixture.nativeElement.querySelector('table');
  expect(table).toBeTruthy();
  expect(fixture.nativeElement.textContent).toContain('Total Costs');
});
```

---

### File 10: `frontend/carebase-frontend/src/app/doctor-use-case/doctor-use-case.spec.ts`
- **Role:** Doctor Treatment Documentation Spec
- **Tests / Passing:** 4 / 4
- **Compliance Score:** 25% (🔴 Severe)

#### Smells Identified & Code Citations
1. **Smell 6 (Hardcoded Sleep Hack):** Line 12 defines `settle = () => new Promise((r) => setTimeout(r, 20))` and calls it on lines 32, 40, and 71.
2. **Smell 5 (Bypassing UI & Directly Mutating State):**
   ```typescript
   // Lines 49-67
   component.selectedPatient.set({ id: '2001', name: 'Maria Gruber', ... });
   component.selectedAppointment.set({ id: 101, ... });
   component.treatmentModel.set({ description: 'Follow-up', cost: 150, medications: [...] });
   ```
3. **Smell 5 (Mocking Stepper Interface):** Line 69 passes a dummy stepper `{ next: vi.fn() }` directly into `onSubmitTreatment()`.
   ```typescript
   const mockStepper: any = { next: vi.fn() };
   component.onSubmitTreatment(mockStepper);
   ```
4. **Smell 2 (Zero Component Harnesses):** No harnesses or DOM interactions despite the component featuring multi-step treatments, patient search, and medication autocomplete.
5. **Smell 8 (Unused Imports & Variables):** `provideAnimationsAsync` (line 2) and `dataAdapter` (lines 10, 22) are unused.

#### Violation Analysis
- `testing-fundamentals.md`: Arbitrary `setTimeout` sleep hacks violate zoneless testing.
- `tests.md`: Directly setting signals and passing a dummy object for the stepper completely bypasses the user-facing interface.

#### Recommended Refactoring
Remove `settle()`. Interact with the component through its UI controls and harness loaders.
```typescript
it('records treatment against selected patient and appointment', async () => {
  component.selectedPatient.set({ id: '2001', name: 'Maria Gruber', ssn: '2001', insurance: 'ÖGK' });
  component.selectedAppointment.set({ id: 101, date: '2026-09-10', time: '09:00', doctorName: 'Dr. Weber', reason: 'Consult' });
  component.treatmentModel.set({ description: 'Prescription', cost: 150, medications: [{ id: 1, name: 'Aspirin' }] });

  await component.submitTreatment();
  await fixture.whenStable();

  expect(component.treatmentCompleted()).toBe(true);
});
```

---

### File 11: `frontend/carebase-frontend/src/app/guards/role-guard.spec.ts`
- **Role:** Route Protection & Redirection Guards Spec
- **Tests / Passing:** 14 / 14
- **Compliance Score:** 65% (🟡 Moderate)

#### Smells Identified & Code Citations
1. **Smell 3 (Isolated Function Call Instead of `RouterTestingHarness`):**
   Guards are executed by manually calling the guard function inside `TestBed.runInInjectionContext` with dummy empty objects `{} as ActivatedRouteSnapshot`.
   ```typescript
   // Lines 16-17, 38, 44-46
   const mockRoute = {} as ActivatedRouteSnapshot;
   const mockState = {} as RouterStateSnapshot;
   // ...
   const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
   expect(result instanceof UrlTree).toBe(true);
   expect((result as UrlTree).toString()).toBe('/');
   ```
2. **Smell 8 (Unused Variable):** Line 25 injects `router = TestBed.inject(Router)` in `beforeEach`, but `router` is never used.

#### Violation Analysis
- `router-testing.md`: "When testing components that involve routing, it is crucial not to mock the Router or related services. Instead, use the `RouterTestingHarness`... ensures you are testing the actual router configuration, guards, and resolvers".
- While testing a functional guard in injection context is valid for isolated unit checks, verifying that actual route transitions are blocked or redirected in the live routing pipeline provides true end-to-end routing security verification.

#### Recommended Refactoring
Supplement or enhance the suite with `RouterTestingHarness` tests proving that navigating to `/admin` without admin credentials actually redirects the user to `/`.
```typescript
it('redirects unauthorized doctor away from /admin route', async () => {
  session.setRole('doctor');
  const harness = await RouterTestingHarness.create();

  await harness.navigateByUrl('/admin');
  await harness.fixture.whenStable();

  const router = TestBed.inject(Router);
  expect(router.url).toBe('/');
});
```

---

### File 12: `frontend/carebase-frontend/src/app/header-layout/header-layout.spec.ts`
- **Role:** Top Navigation & Active Persona Header Spec
- **Tests / Passing:** 2 / 2
- **Compliance Score:** 20% (🔴 Severe)

#### Smells Identified & Code Citations
1. **Smell 3 & 4 (Mocking Router & Services):**
   ```typescript
   // Lines 56-62, 72-74
   { provide: ActorSession, useValue: mockActorSession },
   { provide: AdminService, useValue: mockAdminService },
   // ...
   vi.spyOn(router, 'navigate').mockResolvedValue(true);
   // ...
   expect(mockActorSession.setRole).toHaveBeenCalledWith('admin');
   expect(router.navigate).toHaveBeenCalledWith(['/']);
   ```
2. **Smell 5 (Bypassing UI Surface):** The tests invoke `component.switchRole('admin')` and `component.logout()` directly. The toolbar, avatar badge, `MatMenu`, role items, and sign-out buttons in the template are never rendered or tested.
3. **Smell 1 (Using `fixture.detectChanges()`):** Line 65 calls `fixture.detectChanges()` instead of zoneless `await fixture.whenStable()`.
4. **Smell 7 (Test Names Describe HOW not WHAT):**
   - "should delegate role switching and redirect to '/'"
   - "should clear session and redirect to '/' on logout"

#### Violation Analysis
- `router-testing.md`: Explicitly prohibits mocking `Router` and spying on `router.navigate`.
- `tests.md`: Violates "Bad Tests: Mocking internal collaborators, asserting on call counts/order `toHaveBeenCalledWith`". Test name describes HOW instead of WHAT.
- `component-harnesses.md`: The role menu should be opened and clicked via `MatMenuHarness`.

#### Recommended Refactoring
Use real `ActorSession`, provide test routes, and use `MatMenuHarness` to click the menu items.
```typescript
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatMenuHarness } from '@angular/material/menu/testing';

it('switches persona and redirects home when selecting role from profile menu', async () => {
  const loader = TestbedHarnessEnvironment.loader(fixture);
  const menu = await loader.getHarness(MatMenuHarness);
  await menu.open();

  await menu.clickItem({ text: /System Administrator/ });
  await fixture.whenStable();

  const session = TestBed.inject(ActorSession);
  expect(session.role()).toBe('admin');
});
```

---

### File 13: `frontend/carebase-frontend/src/app/landing-page/landing-page.spec.ts`
- **Role:** Workstation Portal Entry / Landing Page Spec
- **Tests / Passing:** 4 / 4
- **Compliance Score:** 25% (🔴 Severe)

#### Smells Identified & Code Citations
1. **Smell 3 (Mocking Router Navigation):** Lines 24, 43, 49, 55 spy on `router.navigate`.
   ```typescript
   // Lines 24, 41-43
   vi.spyOn(router, 'navigate').mockResolvedValue(true);
   // ...
   component.visitDoctorSite();
   expect(session.role()).toBe('doctor');
   expect(router.navigate).toHaveBeenCalledWith(['doctor']);
   ```
2. **Smell 5 (Bypassing UI Surface):** Calls `component.visitDoctorSite()` directly. The template renders three `<app-action-card>` components that are never clicked.
3. **Smell 8 (Unused Injections):** Lines 19, 28 inject `HttpTestingController` and `provideHttpClientTesting()`, but no HTTP calls exist in this component and `httpTesting.verify()` is never called.
4. **Smell 7 (Scaffold Smoke Test):** Line 36: `it('should create')`.

#### Violation Analysis
- `router-testing.md`: Prohibits mocking `Router`.
- `tests.md`: Tests internal method calls rather than user clicks on the portal action cards.

#### Recommended Refactoring
Use `RouterTestingHarness` and click the portal cards.
```typescript
it('sets doctor role and navigates to doctor workstation when clicking Enter as Doctor', async () => {
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/', LandingPage);

  const button = harness.fixture.nativeElement.querySelector('.action-btn');
  button.click();
  await harness.fixture.whenStable();

  const session = TestBed.inject(ActorSession);
  expect(session.role()).toBe('doctor');
  const router = TestBed.inject(Router);
  expect(router.url).toBe('/doctor');
});
```

---

### File 14: `frontend/carebase-frontend/src/app/services/actor-session.spec.ts`
- **Role:** Session State & Storage Hydration Service Spec
- **Tests / Passing:** 14 / 14
- **Compliance Score:** 95% (🟢 Compliant / Exemplary)

#### Positive Aspects & Adherence
- Tests public API exclusively: `session.setRole`, `session.role()`, `session.activeClerk()`, `session.isAuthenticated()`.
- Verifies real persistence and rehydration against the browser `sessionStorage`.
- Tests edge cases cleanly: corrupted JSON parsing, quota exceeded errors, and restricted environment exceptions.
- Completely free of collaborator mocks and call count assertions.

#### Minor Smells
- Minor: Some tests assert multiple signal properties in sequence, but they represent a cohesive logical assertion verifying session state.

---

### File 15: `frontend/carebase-frontend/src/app/services/clerk-service.spec.ts`
- **Role:** Clerk Domain Facade Service Spec
- **Tests / Passing:** 4 / 4
- **Compliance Score:** 70% (🟡 Moderate)

#### Smells Identified & Code Citations
1. **Smell 7 (Superficial Smoke Assertions on Resources):** Lines 56–74 verify only that resources exist (`expect(res).toBeTruthy()`) without asserting their values or reactive behavior.
   ```typescript
   // Lines 57-73
   const clerksRes = service.searchClerks(() => 'test');
   expect(clerksRes).toBeTruthy();
   const patientsRes = service.searchPatients(() => 'Maria');
   expect(patientsRes).toBeTruthy();
   ```
2. **Smell 7 (False Rehydration Test):** Lines 33–34:
   ```typescript
   const freshClerkService = TestBed.inject(ClerkService);
   expect(freshClerkService.getActiveClerk()()).toEqual(clerk);
   ```
   Because `TestBed` was not reset, `freshClerkService` is the identical singleton instance as `service`, not a freshly hydrated instance.

#### Violation Analysis
- `tests.md`: `.toBeTruthy()` assertions are tautological smoke tests that fail to verify real behavior.

#### Recommended Refactoring
Reset `TestBed` when testing rehydration. Assert on the values produced by the resources rather than checking `.toBeTruthy()`.

---

### File 16: `frontend/carebase-frontend/src/app/services/hospital-data-access.spec.ts`
- **Role:** Data Access Port & Domain Error Specifications
- **Tests / Passing:** 5 / 5
- **Compliance Score:** 100% (🟢 Compliant / Exemplary)

#### Positive Aspects & Adherence
- Clean unit tests verifying prototype inheritance (`BookingConflictError extends HospitalDataError extends Error`).
- Asserts error names, default messages, and optional error cause objects.
- Tests injection token identity. Zero smells.

---

### File 17: `frontend/carebase-frontend/src/app/services/http-hospital-data-adapter.spec.ts`
- **Role:** HTTP Backend Adapter Spec
- **Tests / Passing:** 16 / 16
- **Compliance Score:** 85% (🟢 High)

#### Positive Aspects & Adherence
- Adheres closely to Angular HTTP client testing best practices: verifies endpoint URLs, query parameter construction, request methods, and envelope unwrapping.
- Accurately tests domain error mapping (translating 409 Conflict to `BookingConflictError` and 500 to `HospitalDataError`).
- Calls `httpTesting.verify()` in `afterEach`.

#### Smells Identified & Code Citations
1. **Smell 6 (Hardcoded Sleep Hack):** Line 35 defines `const settle = () => new Promise((r) => setTimeout(r, 10))` and invokes it 8 times across tests to wait for resource reactivity microtasks.

#### Recommended Refactoring
Replace `settle()` with `TestBed.tick()` or Vitest fake timers (`vi.useFakeTimers()`).

---

### File 18: `frontend/carebase-frontend/src/app/services/in-memory-hospital-data-adapter.spec.ts`
- **Role:** In-Memory Test Double Adapter Spec
- **Tests / Passing:** 12 / 12
- **Compliance Score:** 85% (🟢 High)

#### Positive Aspects & Adherence
- Tests real in-memory data store behavior: appointment booking, slot reservation, collision prevention (`BookingConflictError`), search filtering, and reporting aggregations.
- Integration-style test through the public interface.

#### Smells Identified & Code Citations
1. **Smell 6 (Hardcoded Sleep Hack):** Line 21 defines `const settle = () => new Promise((r) => setTimeout(r, 10))` and calls it in 9 tests.

#### Recommended Refactoring
Replace `settle()` with deterministic Vitest fake timers.

---

### File 19: `frontend/carebase-frontend/src/app/transaction-dialog/transaction-dialog.spec.ts`
- **Role:** Asynchronous Transaction Modal Spec
- **Tests / Passing:** 1 / 1
- **Compliance Score:** 10% (🔴 Critical)

#### Smells Identified & Code Citations
1. **Smell 7 (Superficial Smoke Test):** Entire test suite consists of 38 lines with a single `it('should create')`.
   ```typescript
   // Lines 34-36
   it('should create', () => {
     expect(component).toBeTruthy();
   });
   ```
2. **Smell 4 (Mock Dialog Ref with Empty Stubs):** Lines 23–25 provide `MatDialogRef` with an empty stub `{ close: () => {}, disableClose: false }`.

#### Violation Analysis
- `tests.md`: `TransactionDialog` contains a complete state machine (`confirm` -> `loading` -> `success` / `error`), handles async promises and observables, manages modal dismiss blocking (`disableClose`), and renders progress bars. Zero behavior is tested.

#### Recommended Refactoring
Add tests covering the execution flow, progress bar during loading, success completion, and error message display.
```typescript
it('executes transaction action, displays progress bar, and transitions to success', async () => {
  const closeSpy = vi.fn();
  // Provide MatDialogRef with spy
  component.execute();
  expect(component.state()).toBe('loading');

  await fixture.whenStable();

  expect(component.state()).toBe('success');
  component.close(true);
  expect(closeSpy).toHaveBeenCalledWith(true);
});
```

---

## 4. Smell Cross-Matrix Table

The following cross-matrix maps each test file against the 9 identified test smells:

| # | File Name | S1: detectChanges | S2: Brittle DOM | S3: Router Mock | S4: Collab Spying | S5: Bypass UI | S6: Sleep Hack | S7: Smoke Only | S8: Dead Code | S9: Inverted Mock | Overall Grade |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | `app.spec.ts` | ❌ (No wait) | — | — | — | — | — | ❌ | ❌ | — | 🔴 F (15%) |
| 2 | `action-card.spec.ts` | ❌ (No wait) | ❌ | — | — | ❌ | — | ❌ | — | — | 🟡 C (50%) |
| 3 | `admin-page.spec.ts` | ❌ (No wait) | — | — | — | — | — | ❌ | ❌ | — | 🔴 F (10%) |
| 4 | `clerk-page.spec.ts` | ❌ (No wait) | — | — | — | — | — | ❌ | ❌ | — | 🔴 F (10%) |
| 5 | `clerk-report.spec.ts` | — | ❌ | — | ❌ | ❌ | — | — | — | — | 🔴 F (25%) |
| 6 | `appointment-intake-workflow.spec.ts` | — | — | — | ❌ | — | — | — | — | ❌ | 🟡 C (60%) |
| 7 | `clerk-use-case.spec.ts` | ❌ (33+ calls) | ❌ | — | ❌ | ❌ | — | — | — | ❌ | 🔴 F (20%) |
| 8 | `doctor-page.spec.ts` | ❌ (No wait) | — | — | — | — | — | ❌ | — | — | 🔴 F (10%) |
| 9 | `doctor-report.spec.ts` | — | — | — | — | ❌ | ❌ | ❌ | ❌ | — | 🔴 F (25%) |
| 10 | `doctor-use-case.spec.ts` | — | — | — | — | ❌ | ❌ | ❌ | ❌ | — | 🔴 F (25%) |
| 11 | `role-guard.spec.ts` | — | — | ❌ | — | — | — | — | ❌ | — | 🟡 B- (65%) |
| 12 | `header-layout.spec.ts` | ❌ | — | ❌ | ❌ | ❌ | — | ❌ | — | — | 🔴 F (20%) |
| 13 | `landing-page.spec.ts` | — | — | ❌ | — | ❌ | — | ❌ | ❌ | — | 🔴 F (25%) |
| 14 | `actor-session.spec.ts` | — | — | — | — | — | — | — | — | — | 🟢 A (95%) |
| 15 | `clerk-service.spec.ts` | — | — | — | — | — | — | ❌ | — | — | 🟡 B- (70%) |
| 16 | `hospital-data-access.spec.ts` | — | — | — | — | — | — | — | — | — | 🟢 A+ (100%) |
| 17 | `http-hospital-data-adapter.spec.ts` | — | — | — | — | — | ❌ | — | — | — | 🟢 B+ (85%) |
| 18 | `in-memory-hospital-data-adapter.spec.ts`| — | — | — | — | — | ❌ | — | — | — | 🟢 B+ (85%) |
| 19 | `transaction-dialog.spec.ts` | — | — | — | ❌ | — | — | ❌ | — | — | 🔴 F (10%) |

**Legend:**
- ❌ = Smell present in file
- — = Smell not present in file
- 🟢 A / B+ = High Compliance (>= 85%)
- 🟡 B- / C = Moderate Compliance (50% - 70%)
- 🔴 F = Severe Non-Compliance (< 50%)

---

## 5. Prioritized Action Plan & Migration Roadmap

To bring the CareBase frontend test suite into **100% compliance** with repository standards, the refactoring work is organized into four sequential phases.

### Phase 1: Eradicate Critical Flakiness Anti-Patterns (Immediate Priority)
- **Goal:** Remove all non-zoneless calls and timing hacks that threaten test determinism.
- **Tasks:**
  1. **Purge `fixture.detectChanges()`:** In `clerk-use-case.spec.ts` and `header-layout.spec.ts`, replace all 34 occurrences of `fixture.detectChanges()` with `await fixture.whenStable()`.
  2. **Eliminate `settle()` Timeout Helpers:** Replace `const settle = () => new Promise(r => setTimeout(r, 10 | 20))` in `doctor-report.spec.ts`, `doctor-use-case.spec.ts`, `http-hospital-data-adapter.spec.ts`, and `in-memory-hospital-data-adapter.spec.ts` with `await fixture.whenStable()`, `TestBed.tick()`, or Vitest fake timers (`vi.useFakeTimers()`).
  3. **Eradicate `(component as any)` Escapes:** In `clerk-report.spec.ts`, eliminate direct writes to private signal `reportDataSignal`. Inject test records via the provided `InMemoryHospitalDataAdapter`.

### Phase 2: Eliminate Router & Collaborator Mocks (High Priority)
- **Goal:** Migrate routing and collaborator tests to real interfaces.
- **Tasks:**
  1. **Adopt `RouterTestingHarness`:**
     - Refactor `landing-page.spec.ts` and `header-layout.spec.ts` to use `RouterTestingHarness.create()` instead of `vi.spyOn(router, 'navigate')`.
     - Update `role-guard.spec.ts` with route-level integration tests that verify real navigation redirects rather than inspecting `UrlTree` return values in isolation.
  2. **Leverage `InMemoryHospitalDataAdapter`:**
     - In `appointment-intake-workflow.spec.ts` and `clerk-use-case.spec.ts`, remove `vi.spyOn(clerkService, 'bookAppointment')` and `vi.spyOn(dataAccess, 'getDoctors')`. Test against the real in-memory data store.
     - Remove call count assertions (`expect(...).toHaveBeenCalledWith(...)`) in favor of asserting the retrievable state of created appointments.

### Phase 3: Elevate Shallow Smoke Suites to Behavioral Tests (Medium Priority)
- **Goal:** Replace empty `it('should create')` tests with meaningful behavioral specifications.
- **Tasks:**
  1. **`admin-page.spec.ts`:** Test that clicking the action cards invokes `MatDialog.open` with the correct transaction configuration.
  2. **`doctor-page.spec.ts` & `clerk-page.spec.ts`:** Test that clicking portal cards navigates to the respective workflows and analytics reports.
  3. **`transaction-dialog.spec.ts`:** Implement state transition tests for `'confirm' -> 'loading' -> 'success' / 'error'`, verifying progress bar rendering and dialog dismissal.
  4. **`app.spec.ts`:** Remove `compileComponents()` and verify that the application shell renders the header layout.

### Phase 4: Modernize UI Tests with Component Harnesses (Polish & Hardening)
- **Goal:** Insulate component DOM assertions from internal template refactoring.
- **Tasks:**
  1. **Implement Angular Material Harnesses:**
     - `clerk-use-case.spec.ts`: Replace CSS selectors (`.selected-entity-card`, `.step-actions`, `button[matStepperNext]`) with `MatStepperHarness`, `MatButtonHarness`, and `MatInputHarness`.
     - `clerk-report.spec.ts`: Replace direct signal inspections with `MatTableHarness`, `MatSortHarness`, and `MatDatepickerHarness`.
     - `action-card.spec.ts`: Replace `.action-btn` DOM queries with `MatButtonHarness`.
     - `header-layout.spec.ts`: Replace direct method calls with `MatMenuHarness`.
  2. **Clean Dead Code:** Remove unused imports (`provideAnimationsAsync`, `provideRouter`) and unreferenced injected variables (`httpTesting`, `router`, `dataAdapter`) across all files.

---

## 6. Conclusion
The CareBase test suite possesses strong foundations in its service layer (`actor-session.spec.ts`, `hospital-data-access.spec.ts`, and the data adapters), but its component and workflow specs are burdened by legacy Angular habits (`detectChanges()`, brittle CSS queries, router mocking, and collaborator spying). Executing the 4-phase migration plan outlined above will align the codebase with Angular v22 zoneless standards and true behavior-driven testing.
