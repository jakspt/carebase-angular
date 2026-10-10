import {
  computed,
  inject,
  linkedSignal,
  Service,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  map,
  of,
  Subject,
  switchMap,
  timer,
  debounceTime,
  distinctUntilChanged,
  firstValueFrom,
} from 'rxjs';
import { Clerk, CreateAppointmentRequest, Doctor, Patient, TimeSlot } from '../models/models';
import { ClerkService } from '../services/clerk-service';
import { form, maxLength } from '@angular/forms/signals';

export interface BookingNotesModel {
  reason: string;
}

export type BookingResult =
  | { status: 'success'; appointmentId?: number }
  | { status: 'conflict' }
  | { status: 'validation_error'; message: string }
  | { status: 'error'; message: string };

@Service()
export class AppointmentIntakeWorkflow {
  private readonly clerkService = inject(ClerkService);

  // ── Clerk Profile ──
  readonly activeClerk = this.clerkService.getActiveClerk();
  readonly clerkSearchQuery = signal('');
  readonly clerkSearchResults = this.clerkService.searchClerks(this.clerkSearchQuery);
  readonly availableClerks = computed<Clerk[]>(() => {
    if (this.clerkSearchResults.hasValue()) {
      return this.clerkSearchResults.value()?.clerks ?? [];
    }
    return [];
  });

  // ── Step 1: Patient Search ──
  readonly patientSearchQuery = signal('');
  readonly patientInputValue = signal('');
  private readonly patientSearchSubject$ = new Subject<string>();
  readonly patientSearchResults = this.clerkService.searchPatients(this.patientSearchQuery);

  private readonly spinnerDelayMs = 250;
  readonly showPatientSpinner = toSignal(
    toObservable(this.patientSearchResults.isLoading).pipe(
      switchMap((loading) =>
        loading ? timer(this.spinnerDelayMs).pipe(map(() => true)) : of(false),
      ),
    ),
    { initialValue: false },
  );

  readonly patients = computed<Patient[]>(() => {
    if (this.patientSearchResults.hasValue()) {
      return this.patientSearchResults.value()?.patients ?? [];
    }
    return [];
  });
  readonly selectedPatient = signal<Patient | null>(null);

  constructor() {
    this.patientSearchSubject$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((query) => {
        this.patientSearchQuery.set(query);
      });
  }

  // ── Step 2: Department & Doctor Selection ──
  readonly doctorsResource = this.clerkService.getDoctors();
  readonly allDoctors = computed<Doctor[]>(() => {
    if (this.doctorsResource.hasValue()) {
      return this.doctorsResource.value()?.doctors ?? [];
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

  readonly selectedDepartment = signal<string>('');
  readonly filteredDoctors = computed<Doctor[]>(() => {
    const dept = this.selectedDepartment();
    const all = this.allDoctors();
    if (!dept) return all;
    return all.filter((d) => d.department === dept);
  });

  // Declarative dependent state: doctor resets to null if department changes and doctor is not in that department
  readonly selectedDoctor = linkedSignal<string, Doctor | null>({
    source: () => this.selectedDepartment(),
    computation: (newDept, previous) => {
      const prevDoctor = previous?.value;
      if (!prevDoctor) return null;
      if (!newDept) return prevDoctor;
      return prevDoctor.department === newDept ? prevDoctor : null;
    },
  });

  // ── Step 3: Date & Time Slot Selection ──
  readonly minDate = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  readonly selectedDate = signal<Date | null>(this.minDate);
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

  // Declarative dependent state: time slot resets to null whenever doctor, date, or department changes
  readonly selectedTimeSlot = linkedSignal<
    { doctorSsn: string | undefined; date: string; department: string },
    string | null
  >({
    source: () => ({
      doctorSsn: this.selectedDoctor()?.ssn,
      date: this.formattedDate(),
      department: this.selectedDepartment(),
    }),
    computation: (current, previous) => {
      if (
        previous &&
        (current.doctorSsn !== previous.source.doctorSsn ||
          current.date !== previous.source.date ||
          current.department !== previous.source.department)
      ) {
        return null;
      }
      return previous?.value ?? null;
    },
  });

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

  readonly timeSlotsResource = this.clerkService.getTimeSlots(this.slotParams);

  readonly showSlotSpinner = toSignal(
    toObservable(this.timeSlotsResource.isLoading).pipe(
      switchMap((loading) =>
        loading ? timer(this.spinnerDelayMs).pipe(map(() => true)) : of(false),
      ),
    ),
    { initialValue: false },
  );

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
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day, 12, 0, 0);
    }
    return new Date(dateStr);
  });

  // ── Commands / Actions ──

  setClerkSearchInput(query: string): void {
    this.clerkSearchQuery.set(query);
  }

  selectClerk(clerk: Clerk): void {
    this.clerkService.setActiveClerk(clerk);
    this.clerkSearchQuery.set('');
  }

  clearClerk(): void {
    this.clerkService.setActiveClerk(null);
    this.clerkSearchQuery.set('');
  }

  setPatientSearchInput(value: string): void {
    this.patientInputValue.set(value);
    this.patientSearchSubject$.next(value);
  }

  selectPatient(patient: Patient | null): void {
    this.selectedPatient.set(patient);
    this.patientInputValue.set(patient ? `${patient.name} (SSN: ${patient.ssn})` : '');
    this.patientSearchQuery.set(patient ? patient.name : '');
    this.selectedTimeSlot.set(null);
  }

  selectDepartment(dept: string): void {
    this.selectedDepartment.set(dept);
  }

  selectDoctor(doctor: Doctor | null): void {
    this.selectedDoctor.set(doctor);
  }

  selectDate(date: Date | null): void {
    this.selectedDate.set(date);
  }

  selectNextAvailableDate(dateVal?: string | Date | null): void {
    const target = dateVal ?? this.parsedNextAvailableDate() ?? this.nextAvailableDate();
    if (!target) return;
    let targetDate: Date;
    if (typeof target === 'string') {
      const parts = target.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        targetDate = new Date(year, month, day);
      } else {
        targetDate = new Date(target);
      }
    } else {
      targetDate = new Date(target);
    }
    targetDate.setHours(0, 0, 0, 0);
    this.selectDate(targetDate);
  }

  selectTimeSlot(time: string): void {
    if (this.selectedTimeSlot() === time) {
      this.selectedTimeSlot.set(null);
    } else {
      this.selectedTimeSlot.set(time);
    }
  }

  // ── Step 4: Submission & State ──
  readonly bookingModel = signal<BookingNotesModel>({
    reason: '',
  });

  readonly bookingForm = form(this.bookingModel, (schema) => {
    maxLength(schema.reason, 500, { message: 'Reason cannot exceed 500 characters.' });
  });

  readonly reason = computed(() => this.bookingModel().reason);

  readonly isSubmitting = signal(false);
  readonly bookingSuccess = signal(false);
  readonly createdAppointmentId = signal<number | null>(null);

  async submit(reason?: string): Promise<BookingResult> {
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

    const consultationReason = (reason !== undefined ? reason : this.bookingModel().reason).trim();

    const payload: CreateAppointmentRequest = {
      patientSsn: String(patient.ssn),
      doctorSsn: String(doctor.ssn),
      date,
      time,
      reason: consultationReason,
      clerkSsn: activeClerk ? String(activeClerk.ssn) : undefined,
    };

    this.isSubmitting.set(true);

    try {
      const response = await firstValueFrom(this.clerkService.bookAppointment(payload));
      if (response.success) {
        this.bookingSuccess.set(true);
        this.createdAppointmentId.set(response.appointmentId ?? null);
        return {
          status: 'success',
          appointmentId: response.appointmentId,
        };
      }
      return {
        status: 'error',
        message: response.message || 'Failed to schedule appointment.',
      };
    } catch (err: any) {
      if (err?.status === 409) {
        this.selectedTimeSlot.set(null);
        this.timeSlotsResource.reload();
        return { status: 'conflict' };
      }
      const errorMsg =
        err?.error?.error || 'Failed to schedule appointment. Please check your data and retry.';
      return { status: 'error', message: errorMsg };
    } finally {
      this.isSubmitting.set(false);
    }
  }

  reset(): void {
    this.selectedPatient.set(null);
    this.patientInputValue.set('');
    this.patientSearchQuery.set('');
    this.selectedDepartment.set('');
    this.selectedDoctor.set(null);
    this.selectedDate.set(this.minDate);
    this.selectedTimeSlot.set(null);
    this.bookingModel.set({ reason: '' });
    this.bookingSuccess.set(false);
    this.createdAppointmentId.set(null);
    this.isSubmitting.set(false);
  }
}
