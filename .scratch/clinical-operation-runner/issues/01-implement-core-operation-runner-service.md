# 01: Implement Core OperationRunner Service, Signal Forms Bridge, and Feedback Delivery

**What to build:** Create the centralized `OperationRunner` service providing a unified lifecycle for executing mutative actions and submitting Angular Signal Forms. While an operation is in flight, the runner establishes an ambient interaction barrier through an `isLocked` signal, preventing duplicate submissions. When submitting a Signal Form, it evaluates form validity before executing the mutative action, preventing invalid requests from proceeding. Mutative errors are caught and resolved into clear domain error messages via a configurable error message resolver, with automatic fallback handling. Operation completion or failure is communicated through standardized snackbar notifications. The service includes a co-located test provider to enable headless unit testing in consumer suites without rendering snackbar overlays.

Prototype type shape:
```ts
export interface OperationConfig<T> {
  title?: string;
  description?: string;
  confirmMessage?: string;
  loadingMessage?: string;
  successMessage?: string;
  requireConfirmation?: boolean;
  errorMessageResolver?: (error: unknown) => string;
}

export interface OperationResult<T> {
  status: 'success' | 'cancelled' | 'error';
  data?: T;
  error?: unknown;
}
```

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `OperationRunner` service is defined and injectable in the application.
- [x] Exposes an `isLocked` signal indicating whether any operation is currently executing.
- [x] `execute(action, config)` runs the provided action, engages `isLocked` during execution, displays configured feedback, and returns an `OperationResult`.
- [x] `submitForm(form, action, config)` evaluates Signal Form validity, halts execution without triggering the action if invalid, and executes the action if valid.
- [x] Supports custom `errorMessageResolver` in `OperationConfig` and falls back to extracting readable error messages from standard Error and HTTP objects.
- [x] Displays standardized snackbar notifications on successful completion or error when messages are configured or resolved.
- [x] Co-located test provider `provideTestOperationRunner()` is exported to support headless testing without rendering UI overlays.
- [x] Headless unit tests verify execution lifecycles, lockout transitions, form validation gating, and error resolution.
