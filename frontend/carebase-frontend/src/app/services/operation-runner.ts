import { Injectable, Provider, Signal, inject, signal } from '@angular/core';
import { FieldTree, submit } from '@angular/forms/signals';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subject, firstValueFrom, isObservable, of } from 'rxjs';
import { TransactionDialog } from '../transaction-dialog/transaction-dialog';

export interface OperationConfig<_T = unknown> {
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

export function resolveDefaultErrorMessage(error: unknown): string {
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
  private readonly dialog = inject(MatDialog, { optional: true });
  private readonly _isLocked = signal(false);
  readonly isLocked: Signal<boolean> = this._isLocked.asReadonly();

  run<T>(
    action: () => Promise<T> | Observable<T> | T,
    config?: OperationConfig<T>,
  ): Promise<OperationResult<T>> {
    return this.execute(action, config);
  }

  async execute<T>(
    action: () => Promise<T> | Observable<T> | T,
    config?: OperationConfig<T>,
  ): Promise<OperationResult<T>> {
    if (this._isLocked()) {
      return { status: 'cancelled' };
    }

    if (config?.requireConfirmation) {
      return this.executeWithConfirmation(action, config);
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

  private executeWithConfirmation<T>(
    action: () => Promise<T> | Observable<T> | T,
    config: OperationConfig<T>,
  ): Promise<OperationResult<T>> {
    const dialog = this.dialog;
    if (!dialog) {
      return Promise.resolve({ status: 'cancelled' });
    }

    this._isLocked.set(true);

    return new Promise<OperationResult<T>>((resolve) => {
      let actionExecuted = false;
      let actionResult: T | undefined;
      let actionError: unknown;

      const wrappedAction = async () => {
        actionExecuted = true;
        try {
          const rawResult = action();
          actionResult = isObservable(rawResult)
            ? await firstValueFrom(rawResult)
            : await rawResult;
          return actionResult;
        } catch (error) {
          actionError = error;
          throw error;
        }
      };

      const dialogRef = dialog.open(TransactionDialog, {
        width: '450px',
        data: {
          title: config.title ?? 'Confirm Action',
          description:
            config.description ?? config.confirmMessage ?? 'Are you sure you want to proceed?',
          loadingMessage: config.loadingMessage,
          successMessage: config.successMessage,
          action: wrappedAction,
          errorMessageResolver: (err: unknown) =>
            config.errorMessageResolver
              ? config.errorMessageResolver(err)
              : resolveDefaultErrorMessage(err),
        },
      });

      dialogRef.afterClosed().subscribe(() => {
        this._isLocked.set(false);
        if (!actionExecuted) {
          resolve({ status: 'cancelled' });
        } else if (actionError !== undefined) {
          resolve({ status: 'error', error: actionError });
        } else {
          resolve({ status: 'success', data: actionResult });
        }
      });
    });
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

export interface TestOperationRunnerOptions {
  autoConfirm?: boolean;
}

@Injectable()
export class HeadlessDialog {
  readonly openedDialogs = signal<any[]>([]);
  readonly autoConfirm = signal(true);

  open<T, D = any>(_component: any, config?: { data?: D; [key: string]: any }): MatDialogRef<T> {
    const data = config?.data as any;
    this.openedDialogs.update((list) => [...list, data]);
    const closed$ = new Subject<any>();

    const dialogRef = {
      disableClose: false,
      afterClosed: () => closed$.asObservable(),
      close: (result?: any) => {
        closed$.next(result);
        closed$.complete();
      },
    };

    queueMicrotask(async () => {
      if (this.autoConfirm()) {
        if (data?.action) {
          try {
            await data.action();
          } catch {
            // Handled inside wrapped action
          }
        }
        dialogRef.close(true);
      } else {
        dialogRef.close(undefined);
      }
    });

    return dialogRef as unknown as MatDialogRef<T>;
  }
}

export function provideTestOperationRunner(options?: TestOperationRunnerOptions): Provider[] {
  const headlessDialog = new HeadlessDialog();
  if (options?.autoConfirm !== undefined) {
    headlessDialog.autoConfirm.set(options.autoConfirm);
  }

  return [
    OperationRunner,
    HeadlessSnackBar,
    {
      provide: MatSnackBar,
      useExisting: HeadlessSnackBar,
    },
    {
      provide: HeadlessDialog,
      useValue: headlessDialog,
    },
    {
      provide: MatDialog,
      useExisting: HeadlessDialog,
    },
  ];
}
