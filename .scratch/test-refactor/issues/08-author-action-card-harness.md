# 08: Author ActionCardHarness and Modernize Reusable Component Testing

**What to build:** Implement an official Angular CDK component harness (`ActionCardHarness`) for the reusable action card component. Refactor the action card test suite to interact with the component via `fixture.componentRef.setInput(...)` and the new harness, eliminating brittle DOM class queries (`.action-btn`, `.action-card`) and asserting output events through standard testbed mechanisms.

**Blocked by:** 01 (Eradicate Manual fixture.detectChanges and Enforce Zoneless Stability)

**Status:** ready-for-agent

- [ ] A dedicated `ActionCardHarness` extending `@angular/cdk/testing/ComponentHarness` is created in the action card testing directory
- [ ] The harness exposes methods for retrieving title text, description text, clicking the action button, and clicking the card body
- [ ] Action card tests supply inputs via `fixture.componentRef.setInput(...)` and await stability via `await fixture.whenStable()`
- [ ] Brittle CSS class queries (`.action-btn`, `.action-card`) are eliminated from the action card test suite
- [ ] Output event emissions are verified through harness interaction
