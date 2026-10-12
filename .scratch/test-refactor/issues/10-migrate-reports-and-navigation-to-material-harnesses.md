# 10: Migrate Reports and Navigation to Material Harnesses

**What to build:** Refactor the Consultation Frequency Report, Header Layout, and Action Card consumers across landing and portal pages to interact with UI components using Angular Material harnesses (`MatTableHarness`, `MatSortHarness`, `MatMenuHarness`, `ActionCardHarness`). Eliminate direct method calls from tests that bypass user interface surfaces.

**Blocked by:** 03 (Eliminate Private Signal Mutations in Consultation Frequency Report), 05 (Adopt RouterTestingHarness and Eliminate Router Spies), 08 (Author ActionCardHarness and Modernize Reusable Component Testing)

**Status:** complete

- [x] Consultation Frequency Report table row inspection and header sorting are performed using `MatTableHarness` and `MatSortHarness`
- [x] Header Layout role switching and logout actions are executed by opening and clicking menu items via `MatMenuHarness`
- [x] Portal action cards on landing and workstation hub pages are interacted with using `ActionCardHarness`
- [x] Direct component method calls in tests (`component.switchRole()`, `component.logout()`, `component.visitDoctorSite()`, `component.onSortChange()`) are replaced with harness interactions
