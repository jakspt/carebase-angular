# Frontend Testing Standards and Harnesses

CareBase frontend test suites standardise on Angular CDK and Angular Material component harnesses (`TestbedHarnessEnvironment`), `RouterTestingHarness`, zoneless async stability (`await fixture.whenStable()`), and integration through the hexagonal `InMemoryHospitalDataAdapter`. We prohibit manual `fixture.detectChanges()`, ad-hoc `setTimeout` sleep hacks, router method spying (`vi.spyOn(router, 'navigate')`), and collaborator call-count assertions (`toHaveBeenCalledWith`), ensuring tests verify observable behavior, user-facing interactions, and retrievable state transitions through public APIs rather than implementation details.

Shared test DI providers (such as `provideTestHospitalData()`) are co-located with their respective service or adapter module (`src/app/services/in-memory-hospital-data-adapter.ts`). To test infrastructure failure modes without spying on hexagonal port methods, test suites either supply a dedicated failing adapter stub via DI (`{ provide: HOSPITAL_DATA_ACCESS, useValue: failingAdapter }`) or temporarily reassign the adapter method on the injected instance with guaranteed restoration in a `finally` block; `vi.spyOn` on port methods remains prohibited.

## Reactive Autocomplete Stabilization (`MatAutocompleteHarness`)

When interacting with Angular Material autocompletes (`MatAutocompleteHarness`) driven by debounced reactive signals or asynchronous `resource()` / `httpResource()` loaders, calling `.selectOption()` immediately following `.enterText()` introduces timing race conditions and test flakiness under concurrent runner loads.

### Failure Mechanism

Calling `.enterText()` dispatches input events that update search signals. If the component debounces input changes or triggers asynchronous resource settling, the overlay panel may remain closed, momentarily close during re-renders, or drop options before animations finish. Calling `.selectOption()` on an unverified panel causes tests to fail with closed-panel exceptions (`Attempted to open an already closed panel`) or missing option harnesses.

### Canonical Stabilization Pattern

Tests must use deterministic polling with `vi.waitFor` to guarantee that both search data has populated and the panel is actively opened and focused before invoking `.selectOption()`:

```typescript
const autocomplete = await loader.getHarness(MatAutocompleteHarness);
await autocomplete.enterText('Johann');

// Deterministically wait for async resource settling and panel visibility
await vi.waitFor(async () => {
  expect(component.patients().length).toBeGreaterThan(0);
  if (!(await autocomplete.isOpen())) {
    await autocomplete.focus();
  }
  expect(await autocomplete.isOpen()).toBe(true);
});

await autocomplete.selectOption({ text: /Johann Schmidt/ });
await fixture.whenStable();
```

Following this verification sequence guarantees that:
1. The underlying reactive resource or signal has resolved and contains matching results.
2. The autocomplete panel is focused and confirmed open (`isOpen() === true`) in the CDK overlay.
3. Race conditions between debounce microtasks, CDK overlay animations, and option rendering are eliminated.

