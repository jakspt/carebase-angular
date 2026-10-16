import { computed, inject, Injectable, linkedSignal, Signal, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, of, Subject, switchMap, timer, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  AppointmentNotes,
  AppointmentResult,
  BookingResult,
  Clerk,
  CreateAppointmentRequest,
  Doctor,
  Patient,
  TimeSlot,
} from '../models/models';
import { ActorSession } from '../services/actor-session';
import { BookingConflictError, HOSPITAL_DATA_ACCESS } from '../services/hospital-data-access';
import { OperationRunner } from '../services/operation-runner';
import { form, maxLength } from '@angular/forms/signals';

export type { AppointmentNotes, AppointmentResult, BookingResult };

function createDebouncedLoadingSignal(
  isLoadingSignal: Signal<boolean>,
  delayMs = 250,
): Signal<boolean> {
  return toSignal(
    toObservable(isLoadingSignal).pipe(
      switchMap((loading) => (loading ? timer(delayMs).pipe(map(() => true)) : of(false))),
    ),
    { initialValue: false },
  );
}

function parseIsoDate(target: string | Date): Date {
  if (target instanceof Date) {
    const d = new Date(target);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const parts = target.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, 0, 0, 0, 0);
  }
  const d = new Date(target);
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class AppointmentIntakeWorkflow {
  private readonly actorSession = inject(ActorSession);
  private readonly hospitalDataAccess = inject(HOSPITAL_DATA_ACCESS);
  private readonly operationRunner = inject(OperationRunner);

  // ── Clerk Profile ──
  readonly activeClerk = this.actorSession.activeClerk;
  readonly clerkSearchQuery = signal('');
  readonly clerkSearchResults = this.hospitalDataAccess.searchClerks(this.clerkSearchQuery);
  readonly availableClerks = computed<Clerk[]>(() => {
    if (this.clerkSearchResults.hasValue()) {
      const val = this.clerkSearchResults.value();
      return Array.isArray(val) ? val : ((val as any)?.clerks ?? []);
    }
    return [];
  });

  // ── Step 1: Patient Search ──
  private readonly _patientSearchQuery = signal('');
  readonly patientSearchQuery = this._patientSearchQuery.asReadonly();

  private readonly _patientInputValue = signal('');
  readonly patientInputValue = this._patientInputValue.asReadonly();

  private readonly patientSearchSubject$ = new Subject<string>();
  readonly patientSearchResults = this.hospitalDataAccess.searchPatients(this.patientSearchQuery);

  readonly showPatientSpinner = createDebouncedLoadingSignal(this.patientSearchResults.isLoading);

  readonly patients = computed<Patient[]>(() => {
    if (this.patientSearchResults.hasValue()) {
      const val = this.patientSearchResults.value();
      return Array.isArray(val) ? val : ((val as any)?.patients ?? []);
    }
    return [];
  });

  private readonly _selectedPatient = signal<Patient | null>(null);
  readonly selectedPatient = this._selectedPatient.asReadonly();

  constructor() {
    this.patientSearchSubject$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((query) => {
        this._patientSearchQuery.set(query);
      });
  }

  // ── Step 2: Department & Doctor Selection ──
  readonly doctorsResource = this.hospitalDataAccess.getDoctors();
  readonly allDoctors = computed<Doctor[]>(() => {
    if (this.doctorsResource.hasValue()) {
      const val = this.doctorsResource.value();
      return Array.isArray(val) ? val : ((val as any)?.doctors ?? []);
    }
    return [];
  });

  readonly departments = computed<string[]>(() => {
    const list = this.allDoctors();
    const depts = new Set<string>();
    for (const d of list) {
      if (d.department) depts.add(d.department);
    }
    return Array.from(depts).sort();
  });

  private readonly _selectedDepartment = signal<string>('');
  readonly selectedDepartment = this._selectedDepartment.asReadonly();

  readonly filteredDoctors = computed<Doctor[]>(() => {
    const dept = this.selectedDepartment();
    const all = this.allDoctors();
    if (!dept) return all;
    return all.filter((d) => d.department === dept);
  });

  // Declarative dependent state: doctor resets to null if department changes and doctor is not in that department
  private readonly _selectedDoctor = linkedSignal<string, Doctor | null>({
    source: () => this.selectedDepartment(),
    computation: (newDept, previous) => {
      const prevDoctor = previous?.value;
      if (!prevDoctor) return null;
      if (!newDept) return prevDoctor;
      return prevDoctor.department === newDept ? prevDoctor : null;
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
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Declarative dependent state: time slot resets to null whenever doctor, date, department, or patient changes
  private readonly _selectedTimeSlot = linkedSignal<
    {
      doctorSsn: string | undefined;
      date: string;
      department: string;
      patientSsn: string | undefined;
    },
    string | null
  >({
    source: () => ({
      doctorSsn: this.selectedDoctor()?.ssn,
      date: this.formattedDate(),
      department: this.selectedDepartment(),
      patientSsn: this.selectedPatient()?.ssn,
    }),
    computation: (current, previous) => {
      if (
        previous &&
        (current.doctorSsn !== previous.source.doctorSsn ||
          current.date !== previous.source.date ||
          current.department !== previous.source.department ||
          current.patientSsn !== previous.source.patientSsn)
      ) {
        return null;
      }
      return previous?.value ?? null;
    },
  });
  readonly selectedTimeSlot = this._selectedTimeSlot.asReadonly();

  readonly slotParams = computed(() => {
    const date = this.formattedDate();
    const doctor = this.selectedDoctor();
    const patient = this.selectedPatient();
    if (!date || !doctor) return undefined;
    return {
      date,
      doctorSsn: doctor.ssn,
      patientSsn: patient?.ssn,
    };
  });

  readonly timeSlotsResource = this.hospitalDataAccess.getTimeSlots(this.slotParams);

  readonly showSlotSpinner = createDebouncedLoadingSignal(this.timeSlotsResource.isLoading);

  readonly timeSlots = computed<TimeSlot[]>(() => {
    if (this.timeSlotsResource.hasValue()) {
      return this.timeSlotsResource.value()?.slots ?? [];
    }
    return [];
  });

  readonly hasAvailableSlots = computed<boolean>(() => {
    return this.timeSlots().some((s) => s.available);
  });

  readonly nextAvailableDate = computed<string | null>(() => {
    if (this.timeSlotsResource.hasValue()) {
      return this.timeSlotsResource.value()?.nextAvailableDate ?? null;
    }
    return null;
  });

  readonly parsedNextAvailableDate = computed<Date | null>(() => {
    const dateStr = this.nextAvailableDate();
    if (!dateStr) return null;
    const parsed = parseIsoDate(dateStr);
    parsed.setHours(12, 0, 0, 0);
    return parsed;
  });

  // ── Step 4: Notes, Submission & State ──
  readonly appointmentNotes = signal<AppointmentNotes>({
    reason: '',
  });

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
    if (this.isLocked()) return;
    this.clerkSearchQuery.set(query);
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
    if (this.isLocked()) return;
    this._selectedDepartment.set(dept);
  }

  selectDoctor(doctor: Doctor | null): void {
    if (this.isLocked()) return;
    this._selectedDoctor.set(doctor);
  }

  selectDate(date: Date | null): void {
    if (this.isLocked()) return;
    this._selectedDate.set(date);
  }

  selectNextAvailableDate(dateVal?: string | Date | null): void {
    if (this.isLocked()) return;
    const target = dateVal ?? this.parsedNextAvailableDate() ?? this.nextAvailableDate();
    if (!target) return;
    const targetDate = parseIsoDate(target);
    this.selectDate(targetDate);
  }

  selectTimeSlot(time: string): void {
    if (this.isLocked()) return;
    if (this._selectedTimeSlot() === time) {
      this._selectedTimeSlot.set(null);
    } else {
      this._selectedTimeSlot.set(time);
    }
  }

  setReason(reason: string): void {
    if (this.isLocked()) return;
    this.appointmentNotes.set({ reason });
  }

  async submit(): Promise<AppointmentResult> {
    if (this.appointmentForm().invalid()) {
      const errorMsg = this.appointmentForm.reason().errors()[0]?.message || 'Validation error.';
      return {
        status: 'validation_error',
        message: errorMsg,
      };
    }

    const patient = this.selectedPatient();
    const doctor = this.selectedDoctor();
    const date = this.formattedDate();
    const time = this.selectedTimeSlot();
    const activeClerk = this.activeClerk();

    if (!patient || !doctor || !date || !time) {
      return {
        status: 'validation_error',
        message: 'Please fill in all required appointment details.',
      };
    }

    const payload: CreateAppointmentRequest = {
      patientSsn: String(patient.ssn),
      doctorSsn: String(doctor.ssn),
      date,
      time,
      reason: this.appointmentNotes().reason.trim(),
      clerkSsn: activeClerk ? String(activeClerk.ssn) : undefined,
    };

    let conflictOccurred = false;

    const runnerResult = await this.operationRunner.execute(
      async () => {
        const response = await this.hospitalDataAccess.bookAppointment(payload);
        if (!response.success) {
          throw new Error(response.message || 'Failed to schedule appointment.');
        }
        return response;
      },
      {
        successMessage: 'Appointment successfully scheduled.',
        errorMessageResolver: (err: unknown) => {
          if (err instanceof BookingConflictError || (err as any)?.status === 409) {
            conflictOccurred = true;
            this._selectedTimeSlot.set(null);
            this.timeSlotsResource.reload();
            return 'Selected slot was just booked by another user. Please choose an alternate slot.';
          }
          return err instanceof Error
            ? err.message
            : (err as any)?.error?.error ||
                'Failed to schedule appointment. Please check your data and retry.';
        },
      },
    );

    if (runnerResult.status === 'success' && runnerResult.data) {
      this._appointmentSuccess.set(true);
      this._createdAppointmentId.set(runnerResult.data.appointmentId ?? null);
      return {
        status: 'success',
        appointmentId: runnerResult.data.appointmentId,
      };
    }

    if (
      conflictOccurred ||
      runnerResult.error instanceof BookingConflictError ||
      (runnerResult.error as any)?.status === 409
    ) {
      return { status: 'conflict' };
    }

    if (runnerResult.status === 'cancelled') {
      return { status: 'error', message: 'An operation is already in progress.' };
    }

    const errorMsg =
      runnerResult.error instanceof Error
        ? runnerResult.error.message
        : (runnerResult.error as any)?.error?.error ||
          'Failed to schedule appointment. Please check your data and retry.';
    return { status: 'error', message: errorMsg };
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
