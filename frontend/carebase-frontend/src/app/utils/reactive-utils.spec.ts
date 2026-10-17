import { Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDebouncedLoadingSignal } from './reactive-utils';

describe('createDebouncedLoadingSignal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with false when source loading signal is false', () => {
    TestBed.runInInjectionContext(() => {
      const isLoading = signal(false);
      const debounced = createDebouncedLoadingSignal(isLoading);

      TestBed.flushEffects();
      expect(debounced()).toBe(false);
    });
  });

  it('should not show spinner before default 250ms delay elapses', () => {
    TestBed.runInInjectionContext(() => {
      const isLoading = signal(false);
      const debounced = createDebouncedLoadingSignal(isLoading);

      TestBed.flushEffects();
      expect(debounced()).toBe(false);

      isLoading.set(true);
      TestBed.flushEffects();

      // Advance by 150ms (< 250ms default delay)
      vi.advanceTimersByTime(150);
      TestBed.flushEffects();
      expect(debounced()).toBe(false);

      // Advance to 249ms (still below threshold)
      vi.advanceTimersByTime(99);
      TestBed.flushEffects();
      expect(debounced()).toBe(false);
    });
  });

  it('should show spinner once 250ms delay threshold has passed', () => {
    TestBed.runInInjectionContext(() => {
      const isLoading = signal(false);
      const debounced = createDebouncedLoadingSignal(isLoading);

      TestBed.flushEffects();
      isLoading.set(true);
      TestBed.flushEffects();

      vi.advanceTimersByTime(250);
      TestBed.flushEffects();
      expect(debounced()).toBe(true);
    });
  });

  it('should suppress spinner completely if loading finishes before threshold (prevents flicker)', () => {
    TestBed.runInInjectionContext(() => {
      const isLoading = signal(false);
      const debounced = createDebouncedLoadingSignal(isLoading);

      TestBed.flushEffects();
      isLoading.set(true);
      TestBed.flushEffects();

      // Loading lasts 100ms (fast response)
      vi.advanceTimersByTime(100);
      TestBed.flushEffects();
      expect(debounced()).toBe(false);

      isLoading.set(false);
      TestBed.flushEffects();

      // Even if more time passes, spinner never showed
      vi.advanceTimersByTime(300);
      TestBed.flushEffects();
      expect(debounced()).toBe(false);
    });
  });

  it('should immediately clear spinner when loading turns false (no turn-off delay)', () => {
    TestBed.runInInjectionContext(() => {
      const isLoading = signal(false);
      const debounced = createDebouncedLoadingSignal(isLoading);

      TestBed.flushEffects();
      isLoading.set(true);
      TestBed.flushEffects();

      // Wait for spinner to become visible
      vi.advanceTimersByTime(250);
      TestBed.flushEffects();
      expect(debounced()).toBe(true);

      // Loading completes
      isLoading.set(false);
      TestBed.flushEffects();

      // Spinner should clear immediately without waiting another 250ms
      expect(debounced()).toBe(false);
    });
  });

  it('should respect custom delay threshold when specified', () => {
    TestBed.runInInjectionContext(() => {
      const isLoading = signal(false);
      const customDelay = 500;
      const debounced = createDebouncedLoadingSignal(isLoading, customDelay);

      TestBed.flushEffects();
      isLoading.set(true);
      TestBed.flushEffects();

      // At 250ms, default would be true, but custom delay of 500ms should still be false
      vi.advanceTimersByTime(250);
      TestBed.flushEffects();
      expect(debounced()).toBe(false);

      // At 499ms, still false
      vi.advanceTimersByTime(249);
      TestBed.flushEffects();
      expect(debounced()).toBe(false);

      // At 500ms, turns true
      vi.advanceTimersByTime(1);
      TestBed.flushEffects();
      expect(debounced()).toBe(true);
    });
  });

  it('should allow providing an explicit Injector via options outside an active injection context', () => {
    const injector = TestBed.inject(Injector);
    const isLoading = signal(false);

    // Call outside TestBed.runInInjectionContext, passing injector explicitly
    const debounced = createDebouncedLoadingSignal(isLoading, 100, { injector });

    TestBed.flushEffects();
    expect(debounced()).toBe(false);

    isLoading.set(true);
    TestBed.flushEffects();

    vi.advanceTimersByTime(100);
    TestBed.flushEffects();
    expect(debounced()).toBe(true);
  });
});
