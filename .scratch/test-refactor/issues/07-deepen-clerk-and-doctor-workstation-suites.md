# 07: Deepen Clerk, Doctor Workstation, and Facade Service Behavioral Suites

**What to build:** Replace single-line smoke tests in the Clerk and Doctor workstation hub pages with real portal card navigation tests. Deepen the Doctor treatment documentation wizard and expenditure report suites to verify clinical treatment recording and annual financial summaries without UI bypass hacks. Fix superficial `.toBeTruthy()` assertions and false rehydration tests in the Clerk service suite.

**Blocked by:** 04 (Implement provideTestHospitalData and Eliminate Collaborator Spies), 05 (Adopt RouterTestingHarness and Eliminate Router Spies)

**Status:** ready-for-agent

- [ ] Clerk Page tests verify navigation to Appointment intake and Consultation Frequency Report via `RouterTestingHarness`
- [ ] Doctor Page tests verify navigation to clinical treatment documentation and treatment expenditure analytics via `RouterTestingHarness`
- [ ] Doctor treatment documentation tests verify recording a Treatment and prescribed Medications through component workflows rather than passing mock stepper objects
- [ ] Doctor expenditure report tests verify annual cost aggregations and summary metric rendering
- [ ] Clerk Service tests assert reactive resource emission values rather than checking `.toBeTruthy()`
- [ ] Clerk Service session rehydration tests verify fresh state hydration by resetting injector context between test cases
