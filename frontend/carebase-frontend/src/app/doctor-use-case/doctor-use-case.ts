import { Component, computed, inject, signal } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { form, FormField, max, min, required } from '@angular/forms/signals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { Appointment, Medication, Patient } from '../models/models';
import { HOSPITAL_DATA_ACCESS, OperationRunner } from '../services';

interface TreatmentFormModel {
  description: string;
  cost: number;
  medications: Medication[];
}

@Component({
  imports: [
    FormField,
    MatAutocompleteModule,
    MatStepperModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatPaginatorModule,
  ],
  selector: 'app-doctor-use-case',
  styleUrl: './doctor-use-case.css',
  templateUrl: './doctor-use-case.html',
})
export class DoctorUseCase {
  private readonly hospitalDataAccess = inject(HOSPITAL_DATA_ACCESS);
  readonly operationRunner = inject(OperationRunner);

  // ── Step 1: Patient Search (Debounced) ──
  readonly searchQuery = signal('');
  readonly searchInputValue = signal('');
  private readonly searchSubject$ = new Subject<string>();
  readonly searchResults = this.hospitalDataAccess.searchPatients(this.searchQuery);
  readonly patients = computed(() => {
    if (this.searchResults.hasValue()) {
      return this.searchResults.value() ?? [];
    }
    return [];
  });

  readonly selectedPatient = signal<Patient | null>(null);
  readonly selectedPatientId = computed(() => this.selectedPatient()?.id ?? null);
  readonly patientDetailsResource = this.hospitalDataAccess.getPatientDetails(
    this.selectedPatientId,
  );

  constructor() {
    this.searchSubject$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((query) => {
        this.searchQuery.set(query);
      });
  }

  // Formatter for mat-autocomplete input display
  readonly displayPatient = (patient: Patient | null): string => {
    return patient ? `${patient.name} (SSN: ${patient.ssn})` : '';
  };

  // ── Step 2: Appointment Selection ──
  readonly appointments = computed(() => {
    if (this.patientDetailsResource.hasValue()) {
      return this.patientDetailsResource.value()?.appointments ?? [];
    }
    return [];
  });
  readonly selectedAppointment = signal<Appointment | null>(null);

  // Pagination for appointments
  readonly appointmentPageSize = signal(6);
  readonly appointmentPageIndex = signal(0);
  readonly pagedAppointments = computed(() => {
    const list = this.appointments();
    const start = this.appointmentPageIndex() * this.appointmentPageSize();
    return list.slice(start, start + this.appointmentPageSize());
  });

  onAppointmentPageChange(event: PageEvent): void {
    this.appointmentPageSize.set(event.pageSize);
    this.appointmentPageIndex.set(event.pageIndex);
  }

  // ── Step 3: Treatment Form (Signal Forms) ──
  readonly treatmentModel = signal<TreatmentFormModel>({
    description: '',
    cost: 0,
    medications: [],
  });

  readonly treatmentForm = form(this.treatmentModel, (schema) => {
    required(schema.description, { message: 'Treatment description is required.' });
    required(schema.cost, { message: 'Cost is required.' });
    min(schema.cost, 0, { message: 'Cost cannot be negative.' });
    max(schema.cost, 9999, { message: 'Cost cannot exceed 9,999 €.' });
  });

  // Medications autocomplete
  readonly medicationsResource = this.hospitalDataAccess.getMedications();
  readonly medSearchQuery = signal('');
  readonly filteredMedications = computed(() => {
    const all = this.medicationsResource.hasValue() ? (this.medicationsResource.value() ?? []) : [];
    const q = this.medSearchQuery().toLowerCase().trim();
    const selectedIds = new Set(this.treatmentModel().medications.map((m) => m.id));
    const available = all.filter((m) => !selectedIds.has(m.id));
    if (!q) return available;
    return available.filter((m) => m.name.toLowerCase().includes(q));
  });

  readonly treatmentCompleted = signal(false);

  // ── Handlers ──
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchInputValue.set(value);
    this.searchSubject$.next(value);
  }

  onPatientSelected(patient: Patient, stepper: MatStepper): void {
    if (this.operationRunner.isLocked()) return;
    this.selectedPatient.set(patient);
    this.searchInputValue.set(this.displayPatient(patient));
    this.searchQuery.set(patient ? patient.name : '');
    this.selectedAppointment.set(null);
    this.appointmentPageIndex.set(0);
    stepper.next();
  }

  onSelectAppointment(appt: Appointment, stepper: MatStepper): void {
    if (this.operationRunner.isLocked()) return;
    this.selectedAppointment.set(appt);
    stepper.next();
  }

  addMedication(med: Medication): void {
    if (this.operationRunner.isLocked()) return;
    this.treatmentModel.update((current) => ({
      ...current,
      medications: [...current.medications, med],
    }));
    this.medSearchQuery.set('');
  }

  removeMedication(med: Medication): void {
    if (this.operationRunner.isLocked()) return;
    this.treatmentModel.update((current) => ({
      ...current,
      medications: current.medications.filter((m) => m.id !== med.id),
    }));
  }

  async onSubmitTreatment(_stepper?: MatStepper): Promise<void> {
    const patient = this.selectedPatient();
    const appt = this.selectedAppointment();

    const result = await this.operationRunner.submitForm(
      this.treatmentForm,
      async () => {
        if (!patient || !appt) {
          throw new Error('Patient and appointment must be selected.');
        }
        return await this.hospitalDataAccess.addTreatment(patient.id, appt.id, {
          description: this.treatmentModel().description,
          cost: Number(this.treatmentModel().cost),
          medications: this.treatmentModel().medications,
        });
      },
      {
        successMessage: 'Treatment recorded successfully!',
      },
    );

    if (result.status === 'success' && result.data?.success) {
      this.treatmentCompleted.set(true);
    }
  }

  resetWorkflow(stepper: MatStepper): void {
    if (this.operationRunner.isLocked()) return;
    this.selectedPatient.set(null);
    this.selectedAppointment.set(null);
    this.appointmentPageIndex.set(0);
    this.searchQuery.set('');
    this.searchInputValue.set('');
    this.treatmentModel.set({
      description: '',
      cost: 0,
      medications: [],
    });
    this.treatmentCompleted.set(false);
    stepper.reset();
  }
}
