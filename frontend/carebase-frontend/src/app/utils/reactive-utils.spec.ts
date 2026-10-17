import {
  createEnvironmentInjector,
  EnvironmentInjector,
  inject,
  Injector,
  runInInjectionContext,
  signal,
  ɵChangeDetectionScheduler,
  ɵEffectScheduler,
} from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDebouncedLoadingSignal } from './reactive-utils';

describe('createDebouncedLoadingSignal', () => {
  let injector: EnvironmentInjector;

  beforeEach(() => {
    vi.useFakeTimers();
    let scheduled = false;
    injector = createEnvironmentInjector(
      [
        {
          provide: ɵEffectScheduler,
          useFactory: () => (ɵEffectScheduler as any).ɵprov.factory(),
        },
        {
          provide: ɵChangeDetectionScheduler,
          useFactory: () => {
            const es = inject(ɵEffectScheduler);
            return {
              notify: () => {
                if (!scheduled) {
                  scheduled = true;
                  queueMicrotask(() => {
                    scheduled = false;
                    es.flush();
                  });
                }
              },
            };
          },
        },
      ],
      Injector.NULL as unknown as EnvironmentInjector,
    );
  });

  afterEach(() => {
    injector.destroy();
    vi.useRealTimers();
  });

  it('should initialize with false when source loading signal is false', () => {
    runInInjectionContext(injector, () => {
      const isLoading = signal(false);
      const debounced = createDebouncedLoadingSignal(isLoading);

      expect(debounced()).toBe(false);
    });
  });

  it('should not show spinner before default 250ms delay elapses', async () => {
    await runInInjectionContext(injector, async () => {
      const isLoading = signal(false);
      const debounced = createDebouncedLoadingSignal(isLoading);

      expect(debounced()).toBe(false);

      isLoading.set(true);

      // Advance by 150ms (< 250ms default delay)
      await vi.advanceTimersByTimeAsync(150);
      expect(debounced()).toBe(false);

      // Advance to 249ms (still below threshold)
      await vi.advanceTimersByTimeAsync(99);
      expect(debounced()).toBe(false);
    });
  });

  it('should show spinner once 250ms delay threshold has passed', async () => {
    await runInInjectionContext(injector, async () => {
      const isLoading = signal(false);
      const debounced = createDebouncedLoadingSignal(isLoading);

      isLoading.set(true);

      await vi.advanceTimersByTimeAsync(250);
      expect(debounced()).toBe(true);
    });
  });

  it('should suppress spinner completely if loading finishes before threshold (prevents flicker)', async () => {
    await runInInjectionContext(injector, async () => {
      const isLoading = signal(false);
      const debounced = createDebouncedLoadingSignal(isLoading);

      isLoading.set(true);

      // Loading lasts 100ms (fast response)
      await vi.advanceTimersByTimeAsync(100);
      expect(debounced()).toBe(false);

      isLoading.set(false);

      // Even if more time passes, spinner never showed
      await vi.advanceTimersByTimeAsync(300);
      expect(debounced()).toBe(false);
    });
  });

  it('should immediately clear spinner when loading turns false (no turn-off delay)', async () => {
    await runInInjectionContext(injector, async () => {
      const isLoading = signal(false);
      const debounced = createDebouncedLoadingSignal(isLoading);

      isLoading.set(true);

      // Wait for spinner to become visible
      await vi.advanceTimersByTimeAsync(250);
      expect(debounced()).toBe(true);

      // Loading completes
      isLoading.set(false);
      await vi.advanceTimersByTimeAsync(0);

      // Spinner should clear immediately without waiting another 250ms
      expect(debounced()).toBe(false);
    });
  });

  it('should respect custom delay threshold when specified', async () => {
    await runInInjectionContext(injector, async () => {
      const isLoading = signal(false);
      const customDelay = 500;
      const debounced = createDebouncedLoadingSignal(isLoading, customDelay);

      isLoading.set(true);

      // At 250ms, default would be true, but custom delay of 500ms should still be false
      await vi.advanceTimersByTimeAsync(250);
      expect(debounced()).toBe(false);

      // At 499ms, still false
      await vi.advanceTimersByTimeAsync(249);
      expect(debounced()).toBe(false);

      // At 500ms, turns true
      await vi.advanceTimersByTimeAsync(1);
      expect(debounced()).toBe(true);
    });
  });

  it('should allow providing an explicit Injector via options outside an active injection context', async () => {
    const isLoading = signal(false);

    // Call outside runInInjectionContext, passing injector explicitly
    const debounced = createDebouncedLoadingSignal(isLoading, 100, { injector });

    expect(debounced()).toBe(false);

    isLoading.set(true);

    await vi.advanceTimersByTimeAsync(100);
    expect(debounced()).toBe(true);
  });
});
