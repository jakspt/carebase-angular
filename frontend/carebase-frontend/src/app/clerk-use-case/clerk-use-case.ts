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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  // ── Clerk Profile ──
  readonly activeClerk = this.workflow.activeClerk;
  readonly clerkSearchQuery = this.workflow.clerkSearchQuery;
  readonly clerkInput = viewChild<ElementRef<HTMLInputElement>>('clerkInput');
  readonly availableClerks = this.workflow.availableClerks;

  // ── Step 1: Patient Search ──
  readonly patientSearchQuery = this.workflow.patientSearchQuery;
  readonly patientInputValue = this.workflow.patientInputValue;
  readonly patientSearchResults = this.workflow.patientSearchResults;
  readonly showPatientSpinner = this.workflow.showPatientSpinner;
  readonly patients = this.workflow.patients;
  readonly selectedPatient = this.workflow.selectedPatient;

  // ── Step 2: Department & Doctor Selection ──
  readonly allDoctors = this.workflow.allDoctors;
  readonly departments = this.workflow.departments;
  readonly selectedDepartment = this.workflow.selectedDepartment;
  readonly filteredDoctors = this.workflow.filteredDoctors;
  readonly selectedDoctor = this.workflow.selectedDoctor;

  // ── Step 3: Date & Time Slot Selection ──
  readonly minDate = this.workflow.minDate;
  readonly selectedDate = this.workflow.selectedDate;
  readonly formattedDate = this.workflow.formattedDate;
  readonly selectedTimeSlot = this.workflow.selectedTimeSlot;
  readonly timeSlotsResource = this.workflow.timeSlotsResource;
  readonly showSlotSpinner = this.workflow.showSlotSpinner;
  readonly timeSlots = this.workflow.timeSlots;
  readonly hasAvailableSlots = this.workflow.hasAvailableSlots;
  readonly nextAvailableDate = this.workflow.nextAvailableDate;
  readonly parsedNextAvailableDate = this.workflow.parsedNextAvailableDate;

  // ── Step 4: Reason & Booking Review ──
  readonly bookingModel = this.workflow.bookingModel;
  readonly bookingForm = this.workflow.bookingForm;
  readonly reason = this.workflow.reason;
  readonly isSubmitting = this.workflow.isSubmitting;
  readonly bookingSuccess = this.workflow.bookingSuccess;
  readonly createdAppointmentId = this.workflow.createdAppointmentId;

  // ── Methods & Handlers ──

  onClerkSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.workflow.setClerkSearchInput(val);
  }

  selectClerk(clerk: Clerk): void {
    this.workflow.selectClerk(clerk);
  }

  clearClerk(): void {
    this.workflow.clearClerk();
    this.cdr.detectChanges();
    const inputEl = this.clerkInput()?.nativeElement;
    if (inputEl) {
      inputEl.focus();
    } else {
      setTimeout(() => this.clerkInput()?.nativeElement?.focus(), 0);
    }
  }

  onPatientSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.workflow.setPatientSearchInput(val);
  }

  selectPatient(patient: Patient): void {
    this.workflow.selectPatient(patient);
  }

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

  onDepartmentChange(dept: string): void {
    this.workflow.selectDepartment(dept);
  }

  onDoctorChange(doctor: Doctor): void {
    this.workflow.selectDoctor(doctor);
  }

  selectDoctor(doctor: Doctor): void {
    this.workflow.selectDoctor(doctor);
  }

  onDateChange(date: Date | null): void {
    this.workflow.selectDate(date);
  }

  selectNextAvailableDate(dateVal?: string | Date | null): void {
    this.workflow.selectNextAvailableDate(dateVal);
  }

  selectTimeSlot(time: string): void {
    this.workflow.selectTimeSlot(time);
  }

  async confirmBooking(stepper?: MatStepper): Promise<void> {
    await submit(this.bookingForm, async () => {
      const result = await this.workflow.submit();
      switch (result.status) {
        case 'success':
          this.snackBar.open(
            `Appointment successfully scheduled (ID: ${result.appointmentId ?? 'N/A'})`,
            'Close',
            { duration: 5000 },
          );
          break;
        case 'conflict':
          this.snackBar.open(
            'Selected slot was just booked by another user. Please choose an alternate slot.',
            'Close',
            { duration: 6000 },
          );
          if (stepper) {
            stepper.selectedIndex = 2;
          }
          break;
        case 'validation_error':
          this.snackBar.open(result.message, 'Close', { duration: 4000 });
          break;
        case 'error':
          this.snackBar.open(result.message, 'Close', { duration: 5000 });
          break;
      }
    });
  }

  resetWorkflow(stepper?: MatStepper): void {
    this.workflow.reset();
    if (stepper) {
      stepper.reset();
    }
  }
}
