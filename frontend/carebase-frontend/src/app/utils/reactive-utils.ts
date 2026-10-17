import { Injector, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, of, switchMap, timer } from 'rxjs';

export interface DebouncedLoadingOptions {
  injector?: Injector;
}

/**
 * Creates a debounced boolean loading signal that only emits true if `isLoading`
 * remains true for at least `delayMs` (default: 250ms), preventing UI spinner flicker
 * during fast responses. As soon as `isLoading` turns false, the debounced signal
 * immediately emits false without delay.
 *
 * @param isLoading Active loading signal
 * @param delayMs Debounce threshold delay in milliseconds (default: 250)
 * @param options Optional configuration including custom Injector
 */
export function createDebouncedLoadingSignal(
  isLoading: Signal<boolean>,
  delayMs: number = 250,
  options?: DebouncedLoadingOptions,
): Signal<boolean> {
  const toObservableOptions = options?.injector ? { injector: options.injector } : undefined;
  const toSignalOptions = {
    initialValue: false,
    ...(options?.injector ? { injector: options.injector } : {}),
  };

  return toSignal(
    toObservable(isLoading, toObservableOptions).pipe(
      switchMap((loading) => (loading ? timer(delayMs).pipe(map(() => true)) : of(false))),
    ),
    toSignalOptions,
  );
}
