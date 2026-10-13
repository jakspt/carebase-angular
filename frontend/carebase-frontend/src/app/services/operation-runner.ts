import { Injectable, Provider, Signal, inject, signal } from '@angular/core';
import { FieldTree, submit } from '@angular/forms/signals';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, firstValueFrom, isObservable, of } from 'rxjs';

export interface OperationConfig<T = unknown> {
  title?: string;
  description?: string;
  confirmMessage?: string;
  loadingMessage?: string;
  successMessage?: string;
  requireConfirmation?: boolean;
  errorMessageResolver?: (error: unknown) => string;
}

export interface OperationResult<T = unknown> {
  status: 'success' | 'cancelled' | 'error';
  data?: T;
  error?: unknown;
}

function resolveDefaultErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, any>;
    if (errObj['error']) {
      if (typeof errObj['error'] === 'string') {
        return errObj['error'];
      }
      if (typeof errObj['error'] === 'object' && errObj['error'] !== null) {
        const nested = errObj['error'] as Record<string, any>;
        if (typeof nested['message'] === 'string') {
          return nested['message'];
        }
        if (typeof nested['detail'] === 'string') {
          return nested['detail'];
        }
        if (typeof nested['error'] === 'string') {
          return nested['error'];
        }
      }
    }
    if (typeof errObj['message'] === 'string') {
      return errObj['message'];
    }
    if (typeof errObj['detail'] === 'string') {
      return errObj['detail'];
    }
  }
  return 'An unexpected error occurred. Please try again.';
}

@Injectable({
  providedIn: 'root',
})
export class OperationRunner {
  private readonly snackBar = inject(MatSnackBar, { optional: true });
  private readonly _isLocked = signal(false);
  readonly isLocked: Signal<boolean> = this._isLocked.asReadonly();

  async execute<T>(
    action: () => Promise<T> | Observable<T> | T,
    config?: OperationConfig<T>,
  ): Promise<OperationResult<T>> {
    if (this._isLocked()) {
      return { status: 'cancelled' };
    }

    this._isLocked.set(true);
    try {
      if (config?.loadingMessage) {
        this.snackBar?.open(config.loadingMessage, 'Close');
      }

      const rawResult = action();
      const data = isObservable(rawResult) ? await firstValueFrom(rawResult) : await rawResult;

      if (config?.successMessage) {
        this.snackBar?.open(config.successMessage, 'Close', { duration: 4000 });
      }

      return {
        status: 'success',
        data,
      };
    } catch (error) {
      this.notifyError(error, config);

      return {
        status: 'error',
        error,
      };
    } finally {
      this._isLocked.set(false);
    }
  }

  async submitForm<TModel, TResult = unknown>(
    formTree: FieldTree<TModel>,
    action: () => Promise<TResult> | Observable<TResult> | TResult,
    config?: OperationConfig<TResult>,
  ): Promise<OperationResult<TResult>> {
    if (this._isLocked()) {
      return { status: 'cancelled' };
    }

    if (formTree().invalid()) {
      // Run submit with empty action to trigger field touch states across the tree
      await submit(formTree, async () => {});
      const errorMsg = this.extractValidationMessage(formTree);
      const validationError = new Error(errorMsg);
      this.notifyError(validationError, config);

      return {
        status: 'error',
        error: validationError,
      };
    }

    let result: OperationResult<TResult> = { status: 'cancelled' };
    const submitted = await submit(formTree, async () => {
      result = await this.execute(action, config);
    });

    if (!submitted && result.status === 'cancelled') {
      const errorMsg = this.extractValidationMessage(formTree);
      const validationError = new Error(errorMsg);
      this.notifyError(validationError, config);

      return {
        status: 'error',
        error: validationError,
      };
    }

    return result;
  }

  private notifyError(error: unknown, config?: OperationConfig<unknown>): void {
    const resolvedMessage = config?.errorMessageResolver
      ? config.errorMessageResolver(error)
      : resolveDefaultErrorMessage(error);

    this.snackBar?.open(resolvedMessage, 'Close', { duration: 5000 });
  }

  private extractValidationMessage<TModel>(formTree: FieldTree<TModel>): string {
    const summary = formTree().errorSummary?.();
    if (summary && summary.length > 0 && summary[0]?.message) {
      return summary[0].message;
    }
    const rootErrors = formTree().errors?.();
    if (rootErrors && rootErrors.length > 0 && rootErrors[0]?.message) {
      return rootErrors[0].message;
    }
    return 'Form validation failed. Please check the entered fields.';
  }
}

@Injectable()
export class HeadlessSnackBar {
  readonly lastMessage = signal<string | null>(null);
  readonly messages = signal<string[]>([]);

  open(message: string, _action?: string, _config?: unknown) {
    this.lastMessage.set(message);
    this.messages.update((msgs) => [...msgs, message]);
    return {
      onAction: () => of(void 0),
      afterDismissed: () => of(void 0),
    };
  }
}

export function provideTestOperationRunner(): Provider[] {
  return [
    OperationRunner,
    HeadlessSnackBar,
    {
      provide: MatSnackBar,
      useExisting: HeadlessSnackBar,
    },
  ];
}
