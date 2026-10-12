# 05: Adopt RouterTestingHarness and Eliminate Router Spies

**What to build:** Replace router method spying (`vi.spyOn(router, 'navigate')`) in the workstation landing page and header layout component test suites with `RouterTestingHarness`. Supplement the role guard specification with route-level integration tests that verify genuine route transitions, active URL states, and unauthorized access redirection to the home route without mocking `Router`.

**Blocked by:** 01 (Eradicate Manual fixture.detectChanges and Enforce Zoneless Stability)

**Status:** ready-for-agent

- [ ] All instances of `vi.spyOn(router, 'navigate')` in the landing page test suite are replaced with `RouterTestingHarness.create()` and assertions on `router.url`
- [ ] Header layout role switching and sign-out tests verify destination routing via `RouterTestingHarness`
- [ ] Route-level integration tests in the role guard suite prove that accessing protected Doctor, Clerk, or Admin paths redirects unauthorized actors to `/`
- [ ] Direct invocation of guards with empty mock route snapshot objects is supplemented by live route harness checks
- [ ] Unused `Router` and testing controller injections are removed from the migrated suites
