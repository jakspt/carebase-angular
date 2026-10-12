# Test Suite Refactoring Milestone Dashboard

**Target Codebase:** `frontend/carebase-frontend/src/app/**/*.spec.ts` (Angular v22, Vitest, Zoneless)  
**Specification:** [spec.md](./spec.md)  
**Status:** `ready-for-agent`  
**Overall Initial Compliance Score:** 47.6% (Target: 100%)  
**Audited Files:** 19 test files (153 tests)

---

## 1. Phase Roadmap & Execution Progress

| Phase | Description | Scope | Status | Phase Tracker |
|:---:|---|---|:---:|:---:|
| **1** | **Flakiness & Anti-Patterns** | Purge `fixture.detectChanges()`, replace `settle()` sleeps with `vi.waitFor`, eliminate `(component as any)` signal writes | ⏳ Ready | `phase-1-flakiness.md` |
| **2** | **Router & Mock Elimination** | Adopt `RouterTestingHarness`, eliminate collaborator method spying, integrate `provideTestHospitalData()` | ⏳ Pending | `phase-2-router-mocks.md` |
| **3** | **Behavioral Depth for Shallow Suites** | Replace empty `it('should create')` tests with comprehensive user workflow specifications | ⏳ Pending | `phase-3-behavioral-depth.md` |
| **4** | **Component Harnesses & Cleanup** | Create `ActionCardHarness`, migrate all DOM queries to Material harnesses, purge Karma boilerplate | ⏳ Pending | `phase-4-harnesses-cleanup.md` |

---

## 2. Implementation Tickets (Dependency Order)

| # | Ticket | Blocked By | Status |
|---|---|---|:---:|
| 01 | [01: Eradicate Manual fixture.detectChanges and Enforce Zoneless Stability](./issues/01-eradicate-fixture-detect-changes.md) | None (Frontier) | 🟢 Complete |
| 02 | [02: Replace settle setTimeout Sleeps with Deterministic vi.waitFor](./issues/02-replace-settle-sleeps-with-vi-waitfor.md) | None (Frontier) | 🟢 Complete |
| 03 | [03: Eliminate Private Signal Mutations in Consultation Frequency Report](./issues/03-eliminate-private-signal-mutations-in-clerk-report.md) | 01 | 🟢 Complete |
| 04 | [04: Implement provideTestHospitalData and Eliminate Collaborator Spies](./issues/04-implement-provide-test-hospital-data-and-eliminate-collaborator-spies.md) | 02 | 🟢 Complete |
| 05 | [05: Adopt RouterTestingHarness and Eliminate Router Spies](./issues/05-adopt-router-testing-harness-and-eliminate-router-spies.md) | 01 | 🟢 Complete |
| 06 | [06: Deepen Admin Page and Transaction Dialog Behavioral Suites](./issues/06-deepen-admin-page-and-transaction-dialog-suites.md) | 04 | 🟢 Complete |
| 07 | [07: Deepen Clerk, Doctor Workstation, and Facade Service Behavioral Suites](./issues/07-deepen-clerk-and-doctor-workstation-suites.md) | 04, 05 | 🟢 Complete |
| 08 | [08: Author ActionCardHarness and Modernize Reusable Component Testing](./issues/08-author-action-card-harness.md) | 01 | 🟢 Complete |
| 09 | [09: Migrate Appointment Intake Wizard to Material Harnesses](./issues/09-migrate-appointment-intake-wizard-to-material-harnesses.md) | 04, 08 | `ready-for-agent` |
| 10 | [10: Migrate Reports and Navigation to Material Harnesses](./issues/10-migrate-reports-and-navigation-to-material-harnesses.md) | 03, 05, 08 | `ready-for-agent` |
| 11 | [11: Purge Karma Boilerplate and Verify Suite Compliance](./issues/11-purge-karma-boilerplate-and-verify-suite-compliance.md) | 06, 07, 09, 10 | `ready-for-agent` |

---

## 3. File-by-File Compliance Scorecard

| # | Spec File | Initial Score | Target | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Final Status |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | `src/app/app.spec.ts` | 15% | 100% | ⬜ | — | ⬜ | ⬜ | ⏳ Pending |
| 2 | `src/app/action-card/action-card.spec.ts` | 50% | 100% | ⬜ | — | — | 🟢 | 🟢 Compliant |
| 3 | `src/app/admin-page/admin-page.spec.ts` | 10% | 100% | ⬜ | — | 🟢 | ⬜ | ⏳ Pending |
| 4 | `src/app/clerk-page/clerk-page.spec.ts` | 10% | 100% | ⬜ | 🟢 | 🟢 | ⬜ | ⏳ Pending |
| 5 | `src/app/clerk-report/clerk-report.spec.ts` | 25% | 100% | 🟢 | ⬜ | — | ⬜ | ⏳ Pending |
| 6 | `src/app/clerk-use-case/appointment-intake-workflow.spec.ts` | 60% | 100% | — | 🟢 | — | — | 🟢 Compliant |
| 7 | `src/app/clerk-use-case/clerk-use-case.spec.ts` | 20% | 100% | 🟢 | 🟢 | — | ⬜ | ⏳ Pending |
| 8 | `src/app/doctor-page/doctor-page.spec.ts` | 10% | 100% | ⬜ | 🟢 | 🟢 | ⬜ | ⏳ Pending |
| 9 | `src/app/doctor-report/doctor-report.spec.ts` | 25% | 100% | 🟢 | — | 🟢 | ⬜ | ⏳ Pending |
| 10 | `src/app/doctor-use-case/doctor-use-case.spec.ts` | 25% | 100% | 🟢 | 🟢 | 🟢 | ⬜ | ⏳ Pending |
| 11 | `src/app/guards/role-guard.spec.ts` | 65% | 100% | — | 🟢 | — | ⬜ | ⏳ Pending |
| 12 | `src/app/header-layout/header-layout.spec.ts` | 20% | 100% | 🟢 | 🟢 | — | ⬜ | ⏳ Pending |
| 13 | `src/app/landing-page/landing-page.spec.ts` | 25% | 100% | — | 🟢 | ⬜ | ⬜ | ⏳ Pending |
| 14 | `src/app/services/actor-session.spec.ts` | 95% | 100% | — | — | — | — | 🟢 Compliant |
| 15 | `src/app/services/clerk-service.spec.ts` | 70% | 100% | — | — | 🟢 | — | ⏳ Pending |
| 16 | `src/app/services/hospital-data-access.spec.ts` | 100% | 100% | — | — | — | — | 🟢 Compliant |
| 17 | `src/app/services/http-hospital-data-adapter.spec.ts` | 85% | 100% | 🟢 | — | — | — | 🟢 Compliant |
| 18 | `src/app/services/in-memory-hospital-data-adapter.spec.ts` | 85% | 100% | 🟢 | — | — | — | 🟢 Compliant |
| 19 | `src/app/transaction-dialog/transaction-dialog.spec.ts` | 10% | 100% | — | — | 🟢 | ⬜ | ⏳ Pending |


**Legend:**
- ⬜ = Action pending in phase
- — = No action needed in phase
- 🟢 = Fully compliant
- ⏳ = Pending migration
