# 07: Deepen Clerk, Doctor Workstation, and Facade Service Behavioral Suites

**What to build:** Replace single-line smoke tests in the Clerk and Doctor workstation hub pages with real portal card navigation tests. Deepen the Doctor treatment documentation wizard and expenditure report suites to verify clinical treatment recording and annual financial summaries without UI bypass hacks. Fix superficial `.toBeTruthy()` assertions and false rehydration tests in the Clerk service suite.

**Blocked by:** 04 (Implement provideTestHospitalData and Eliminate Collaborator Spies), 05 (Adopt RouterTestingHarness and Eliminate Router Spies)

**Status:** resolved

- [x] Clerk Page tests verify navigation to Appointment intake and Consultation Frequency Report via `RouterTestingHarness`
- [x] Doctor Page tests verify navigation to clinical treatment documentation and treatment expenditure analytics via `RouterTestingHarness`
- [x] Doctor treatment documentation tests verify recording a Treatment and prescribed Medications through component workflows rather than passing mock stepper objects
- [x] Doctor expenditure report tests verify annual cost aggregations and summary metric rendering
- [x] Clerk Service tests assert reactive resource emission values rather than checking `.toBeTruthy()`
- [x] Clerk Service session rehydration tests verify fresh state hydration by resetting injector context between test cases
