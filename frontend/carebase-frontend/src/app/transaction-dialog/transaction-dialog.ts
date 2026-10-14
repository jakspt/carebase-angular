import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { from, Observable } from 'rxjs';

export interface TransactionDialogData<T = unknown> {
  title: string;
  description: string;
  loadingMessage?: string;
  successMessage?: string;
  /** Async function that performs the transaction */
  action: () => Observable<T> | Promise<T>;
  errorMessageResolver?: (error: unknown) => string;
}

export type TransactionState = 'confirm' | 'loading' | 'success' | 'error';

@Component({
  imports: [MatDialogModule, MatButtonModule, MatProgressBarModule, MatIconModule],
  selector: 'app-transaction-dialog',
  styleUrl: './transaction-dialog.css',
  templateUrl: './transaction-dialog.html',
})
export class TransactionDialog {
  readonly data: TransactionDialogData = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TransactionDialog>);
  private readonly destroyRef = inject(DestroyRef);

  // Discrete state tracking
  readonly state = signal<TransactionState>('confirm');
  readonly errorMessage = signal<string | null>(null);

  execute(): void {
    this.state.set('loading');

    // Prevent accidental dismiss via ESC or backdrop click while working
    this.dialogRef.disableClose = true;

    from(this.data.action())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.state.set('success');
          this.dialogRef.disableClose = false;
        },
        error: (err) => {
          const message = this.data.errorMessageResolver
            ? this.data.errorMessageResolver(err)
            : err?.message || 'An unexpected error occurred.';
          this.errorMessage.set(message);
          this.state.set('error');
          this.dialogRef.disableClose = false;
        },
      });
  }

  close(success: boolean): void {
    this.dialogRef.close(success);
  }
}
