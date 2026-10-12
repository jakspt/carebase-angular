# 01: Eradicate Manual fixture.detectChanges and Enforce Zoneless Stability

**What to build:** Refactor the multi-step Appointment intake wizard and header layout component test suites so that all UI change detection and microtask draining rely exclusively on zoneless async stability (`await fixture.whenStable()`), permanently removing synchronous `fixture.detectChanges()` calls that mask timing issues and disrupt signal dependency updates.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] All manual calls to `fixture.detectChanges()` in the multi-step Appointment intake wizard test suite are replaced with `await fixture.whenStable()`
- [x] Manual calls to `fixture.detectChanges()` in the header layout test suite are replaced with `await fixture.whenStable()`
- [x] Every user interaction (button click, stepper transition, form input) follows the zoneless "Act, Wait, Assert" pattern
- [x] The entire frontend test suite passes green without synchronous change detection warnings or timing errors
