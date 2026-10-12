# 02: Document Autocomplete Stabilization Pattern in ADR-0003

**What to build:** Update `docs/adr/0003-frontend-testing-standards-and-harnesses.md` to document the canonical, deterministic pattern for testing Angular Material autocompletes (`MatAutocompleteHarness`) bound to debounced reactive signals. Detail the necessity of verifying and ensuring open/focused panel state within `vi.waitFor` prior to calling `.selectOption()` to eliminate timing race conditions across CI environments.

**Blocked by:** None (Frontier)
**Type:** task
**Status:** resolved

- [x] `docs/adr/0003-frontend-testing-standards-and-harnesses.md` includes explicit guidance on `MatAutocompleteHarness` interactions with debounced signals
- [x] Code examples illustrate deterministic polling with `vi.waitFor` ensuring `isOpen()` is true prior to `.selectOption()`
- [x] Guidelines explain why unverified `.selectOption()` calls fail when autocomplete panels close during async resource settling

## Answer

Updated `docs/adr/0003-frontend-testing-standards-and-harnesses.md` with a dedicated section "Reactive Autocomplete Stabilization (`MatAutocompleteHarness`)". The documentation details the failure mechanism behind unverified `.selectOption()` calls during debounced signal and async resource settling, and prescribes the canonical deterministic polling pattern with `vi.waitFor` to verify panel focus and open state before option selection. Also documented co-location of `provideTestAdminService()`.
