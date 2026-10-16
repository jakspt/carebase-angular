import { ChangeDetectorRef, Component, ElementRef, inject, viewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormField, submit } from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Clerk, Doctor, Patient } from '../models/models';
import { AppointmentIntakeWorkflow } from './appointment-intake-workflow';

@Component({
  imports: [
    CommonModule,
    FormField,
    MatAutocompleteModule,
    MatStepperModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatDatepickerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    DatePipe,
  ],
  providers: [provideNativeDateAdapter(), AppointmentIntakeWorkflow],
  selector: 'app-clerk-use-case',
  styleUrl: './clerk-use-case.css',
  templateUrl: './clerk-use-case.html',
})
export class ClerkUseCase {
  readonly workflow = inject(AppointmentIntakeWorkflow);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly clerkInput = viewChild<ElementRef<HTMLInputElement>>('clerkInput');

  displayPatient(patient: Patient | null): string {
    return patient ? `${patient.name} (SSN: ${patient.ssn})` : '';
  }

  displayClerk(clerk: Clerk | null): string {
    return clerk ? `${clerk.name} (SSN: ${clerk.ssn})` : '';
  }

  compareDoctor(d1: Doctor | null, d2: Doctor | null): boolean {
    return d1?.ssn === d2?.ssn;
  }

  isSevereNaca(score?: number | null): boolean {
    return score !== undefined && score !== null && score >= 5;
  }

  getNacaTooltip(score?: number | null): string {
    if (score === undefined || score === null) return '';
    return `NACA ${score}: Pre-hospital severity score (0: Minor to VII: Lethal)`;
  }

  clearClerk(): void {
    if (this.workflow.isLocked()) return;
    this.workflow.clearClerk();
    this.cdr.detectChanges();
    const inputEl = this.clerkInput()?.nativeElement;
    if (inputEl) {
      inputEl.focus();
    } else {
      setTimeout(() => this.clerkInput()?.nativeElement?.focus(), 0);
    }
  }

  async confirmBooking(stepper?: MatStepper): Promise<void> {
    if (this.workflow.isLocked()) return;
    await submit(this.workflow.bookingForm, async () => {
      const result = await this.workflow.submit();
      if (result.status === 'conflict' && stepper) {
        this.cdr.detectChanges();
        stepper.selectedIndex = 2;
      }
    });
  }

  resetWorkflow(stepper?: MatStepper): void {
    if (this.workflow.isLocked()) return;
    this.workflow.reset();
    if (stepper) {
      stepper.reset();
    }
  }
}
