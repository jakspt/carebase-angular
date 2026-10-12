# 11: Purge Karma Boilerplate and Verify Suite Compliance

**What to build:** Remove obsolete Karma-era boilerplate (`compileComponents()`), unused testing controllers (`HttpTestingController`, unreferenced `Router`), and dead imports across all test suites. Standardize on `provideNoopAnimations()` for suites using Angular Material dialogs or SVG charting components. Elevate the root App component specification to verify application shell rendering, and verify that 100% of all 19 test files pass green with full compliance against repository standards.

**Blocked by:** 06 (Deepen Admin Page and Transaction Dialog Behavioral Suites), 07 (Deepen Clerk, Doctor Workstation, and Facade Service Behavioral Suites), 09 (Migrate Appointment Intake Wizard to Material Harnesses), 10 (Migrate Reports and Navigation to Material Harnesses)

**Status:** ready-for-agent

- [ ] All instances of `compileComponents()` are purged across all test suites (including the root App component spec)
- [ ] Root App component specification verifies the application shell and header layout are rendered in the DOM
- [ ] Unused injected variables and testing imports (e.g. unverified `HttpTestingController`, unused `provideAnimationsAsync`, `provideRouter`) are removed across all specs
- [ ] Test suites using Material dialogs or charting components consistently configure `provideNoopAnimations()`
- [ ] All 19 test files pass 100% green under Vitest
- [ ] All 9 test smells identified in the test quality audit are resolved, achieving 100% compliance with repository testing standards
