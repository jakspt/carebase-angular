# 02: Replace settle setTimeout Sleeps with Deterministic vi.waitFor

**What to build:** Eradicate all non-deterministic `settle()` promise delay functions (`setTimeout(10 | 20)`) across the HTTP hospital data adapter, in-memory hospital data adapter, Doctor expenditure report, and Doctor treatment documentation test suites, replacing them with deterministic `vi.waitFor` assertions or `await fixture.whenStable()`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] All ad-hoc `settle()` `setTimeout` helper functions in the HTTP hospital data adapter test suite are replaced with deterministic `vi.waitFor` expectations for reactive resource and HTTP verification
- [ ] All `settle()` calls in the in-memory hospital data adapter test suite are replaced with deterministic `vi.waitFor` expectations
- [ ] Hardcoded `setTimeout` delays in the Doctor expenditure report and Doctor treatment documentation suites are replaced with `await fixture.whenStable()`
- [ ] All affected test suites run deterministically without arbitrary timer pauses or sleep race conditions
