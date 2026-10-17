import { computed, inject, Injectable, linkedSignal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { form, maxLength } from '@angular/forms/signals';
import { AppointmentNotes, AppointmentResult, BookingResult, Clerk, Doctor, Patient, TimeSlot } from '../models/models';
import { ActorSession, OperationRunner, SCHEDULING_DATA_ACCESS } from '../services';
import { createDebouncedLoadingSignal, parseIsoDate } from '../utils';
import { AppointmentSubmissionCoordinator } from './appointment-submission-coordinator';

export type { AppointmentNotes, AppointmentResult, BookingResult };

@Injectable()
export class AppointmentIntakeWorkflow {
  private readonly actorSession = inject(ActorSession);
  private readonly schedulingDataAccess = inject(SCHEDULING_DATA_ACCESS);
  private readonly submissionCoordinator = inject(AppointmentSubmissionCoordinator);
  private readonly operationRunner = inject(OperationRunner);

  // ── Clerk Profile ──
  readonly activeClerk = this.actorSession.activeClerk;
  readonly clerkSearchQuery = signal('');
  readonly clerkSearchResults = this.schedulingDataAccess.searchClerks(this.clerkSearchQuery);
  readonly availableClerks = computed<Clerk[]>(() => {
    if (!this.clerkSearchResults.hasValue()) return [];
    const val = this.clerkSearchResults.value();
    return Array.isArray(val) ? val : ((val as any)?.clerks ?? []);
  });

  // ── Step 1: Patient Search ──
  private readonly _patientSearchQuery = signal('');
  readonly patientSearchQuery = this._patientSearchQuery.asReadonly();
  private readonly _patientInputValue = signal('');
  readonly patientInputValue = this._patientInputValue.asReadonly();

  private readonly patientSearchSubject$ = new Subject<string>();
  readonly patientSearchResults = this.schedulingDataAccess.searchPatients(this.patientSearchQuery);
  readonly showPatientSpinner = createDebouncedLoadingSignal(this.patientSearchResults.isLoading);

  readonly patients = computed<Patient[]>(() => {
    if (!this.patientSearchResults.hasValue()) return [];
    const val = this.patientSearchResults.value();
    return Array.isArray(val) ? val : ((val as any)?.patients ?? []);
  });

  private readonly _selectedPatient = signal<Patient | null>(null);
  readonly selectedPatient = this._selectedPatient.asReadonly();

  constructor() {
    this.patientSearchSubject$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((query) => this._patientSearchQuery.set(query));
  }

  // ── Step 2: Department & Doctor Selection ──
  readonly doctorsResource = this.schedulingDataAccess.getDoctors();
  readonly allDoctors = computed<Doctor[]>(() => {
    if (!this.doctorsResource.hasValue()) return [];
    const val = this.doctorsResource.value();
    return Array.isArray(val) ? val : ((val as any)?.doctors ?? []);
  });

  readonly departments = computed<string[]>(() => {
    const depts = new Set<string>();
    for (const d of this.allDoctors()) if (d.department) depts.add(d.department);
    return Array.from(depts).sort();
  });

  private readonly _selectedDepartment = signal<string>('');
  readonly selectedDepartment = this._selectedDepartment.asReadonly();

  readonly filteredDoctors = computed<Doctor[]>(() => {
    const dept = this.selectedDepartment();
    const all = this.allDoctors();
    return dept ? all.filter((d) => d.department === dept) : all;
  });

  private readonly _selectedDoctor = linkedSignal<string, Doctor | null>({
    source: () => this.selectedDepartment(),
    computation: (newDept, previous) => {
      const prev = previous?.value;
      return !prev || (newDept && prev.department !== newDept) ? null : prev;
    },
  });
  readonly selectedDoctor = this._selectedDoctor.asReadonly();

  // ── Step 3: Date & Time Slot Selection ──
  readonly minDate = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  private readonly _selectedDate = signal<Date | null>(this.minDate);
  readonly selectedDate = this._selectedDate.asReadonly();

  readonly formattedDate = computed<string>(() => {
    const raw = this.selectedDate();
    if (!raw) return '';
    const d = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  private readonly _selectedTimeSlot = linkedSignal<
    { doctorSsn?: string; date: string; department: string; patientSsn?: string },
    string | null
  >({
    source: () => ({
      doctorSsn: this.selectedDoctor()?.ssn,
      date: this.formattedDate(),
      department: this.selectedDepartment(),
      patientSsn: this.selectedPatient()?.ssn,
    }),
    computation: (curr, prev) => {
      if (!prev) return null;
      const s = prev.source;
      const changed = curr.doctorSsn !== s.doctorSsn || curr.date !== s.date || curr.department !== s.department || curr.patientSsn !== s.patientSsn;
      return changed ? null : prev.value;
    },
  });
  readonly selectedTimeSlot = this._selectedTimeSlot.asReadonly();

  readonly slotParams = computed(() => {
    const date = this.formattedDate();
    const doctor = this.selectedDoctor();
    const patient = this.selectedPatient();
    return !date || !doctor ? undefined : { date, doctorSsn: doctor.ssn, patientSsn: patient?.ssn };
  });

  readonly timeSlotsResource = this.schedulingDataAccess.getTimeSlots(this.slotParams);
  readonly showSlotSpinner = createDebouncedLoadingSignal(this.timeSlotsResource.isLoading);

  readonly timeSlots = computed<TimeSlot[]>(() =>
    this.timeSlotsResource.hasValue() ? this.timeSlotsResource.value()?.slots ?? [] : [],
  );

  readonly hasAvailableSlots = computed<boolean>(() =>
    this.timeSlots().some((s) => s.available),
  );

  readonly nextAvailableDate = computed<string | null>(() =>
    this.timeSlotsResource.hasValue() ? this.timeSlotsResource.value()?.nextAvailableDate ?? null : null,
  );

  readonly parsedNextAvailableDate = computed<Date | null>(() => {
    const dateStr = this.nextAvailableDate();
    if (!dateStr) return null;
    const parsed = parseIsoDate(dateStr);
    parsed.setHours(12, 0, 0, 0);
    return parsed;
  });

  // ── Step 4: Notes, Submission & State ──
  readonly appointmentNotes = signal<AppointmentNotes>({ reason: '' });
  readonly appointmentForm = form(this.appointmentNotes, (schema) => {
    maxLength(schema.reason, 500, { message: 'Reason cannot exceed 500 characters.' });
  });

  // Aliases for compatibility
  readonly bookingModel = this.appointmentNotes;
  readonly bookingForm = this.appointmentForm;
  readonly reason = computed(() => this.appointmentNotes().reason);

  readonly isLocked = this.operationRunner.isLocked;
  readonly isSubmitting = this.isLocked;

  private readonly _appointmentSuccess = signal(false);
  readonly appointmentSuccess = this._appointmentSuccess.asReadonly();
  readonly bookingSuccess = this.appointmentSuccess;

  private readonly _createdAppointmentId = signal<number | null>(null);
  readonly createdAppointmentId = this._createdAppointmentId.asReadonly();

  // ── Commands / Actions ──
  setClerkSearchInput(query: string): void {
    if (!this.isLocked()) this.clerkSearchQuery.set(query);
  }

  selectClerk(clerk: Clerk): void {
    if (this.isLocked()) return;
    this.actorSession.setActiveClerk(clerk);
    this.clerkSearchQuery.set('');
  }

  clearClerk(): void {
    if (this.isLocked()) return;
    this.actorSession.setActiveClerk(null);
    this.clerkSearchQuery.set('');
  }

  setPatientSearchInput(value: string): void {
    if (this.isLocked()) return;
    this._patientInputValue.set(value);
    this.patientSearchSubject$.next(value);
  }

  selectPatient(patient: Patient | null): void {
    if (this.isLocked()) return;
    this._selectedPatient.set(patient);
    this._patientInputValue.set(patient ? `${patient.name} (SSN: ${patient.ssn})` : '');
    this._patientSearchQuery.set(patient ? patient.name : '');
  }

  selectDepartment(dept: string): void {
    if (!this.isLocked()) this._selectedDepartment.set(dept);
  }

  selectDoctor(doctor: Doctor | null): void {
    if (!this.isLocked()) this._selectedDoctor.set(doctor);
  }

  selectDate(date: Date | null): void {
    if (!this.isLocked()) this._selectedDate.set(date);
  }

  selectNextAvailableDate(dateVal?: string | Date | null): void {
    if (this.isLocked()) return;
    const target = dateVal ?? this.parsedNextAvailableDate() ?? this.nextAvailableDate();
    if (target) this.selectDate(parseIsoDate(target));
  }

  selectTimeSlot(time: string): void {
    if (this.isLocked()) return;
    this._selectedTimeSlot.set(this._selectedTimeSlot() === time ? null : time);
  }

  setReason(reason: string): void {
    if (!this.isLocked()) this.appointmentNotes.set({ reason });
  }

  async submit(): Promise<AppointmentResult> {
    if (this.appointmentForm().invalid()) {
      const errorMsg = this.appointmentForm.reason().errors()[0]?.message || 'Validation error.';
      return { status: 'validation_error', message: errorMsg };
    }

    const result = await this.submissionCoordinator.submitAppointment({
      patient: this.selectedPatient(),
      doctor: this.selectedDoctor(),
      clerk: this.activeClerk(),
      date: this.formattedDate(),
      timeSlot: this.selectedTimeSlot(),
      reason: this.appointmentNotes().reason,
      onConflict: () => {
        this._selectedTimeSlot.set(null);
        this.timeSlotsResource.reload();
      },
    });

    if (result.status === 'success') {
      this._appointmentSuccess.set(true);
      this._createdAppointmentId.set(result.appointmentId ?? null);
    }
    return result;
  }

  reset(): void {
    if (this.isLocked()) return;
    this._selectedPatient.set(null);
    this._patientInputValue.set('');
    this._patientSearchQuery.set('');
    this._selectedDepartment.set('');
    this._selectedDoctor.set(null);
    this._selectedDate.set(this.minDate);
    this._selectedTimeSlot.set(null);
    this.appointmentNotes.set({ reason: '' });
    this._appointmentSuccess.set(false);
    this._createdAppointmentId.set(null);
  }
}
