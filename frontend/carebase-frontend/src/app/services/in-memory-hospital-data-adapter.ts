import {
  Injectable,
  InjectionToken,
  Injector,
  Provider,
  ResourceRef,
  Signal,
  inject,
  resource,
  signal,
} from '@angular/core';
import {
  Clerk,
  Doctor,
  Patient,
  Medication,
  Treatment,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  DbStatus,
} from '../models/models';
import {
  AddTreatmentResponse,
  BookingConflictError,
  ConsultationFrequencyReport,
  DateRange,
  DoctorEarningsReport,
  HOSPITAL_DATA_ACCESS,
  HospitalDataAccess,
  PatientVisitsReport,
  TimeSlotQueryParams,
  TimeSlotsResult,
} from './hospital-data-access';
import {
  HospitalFixtureData,
  StoredAppointment,
  createDemoHospitalData,
  createMinimalHospitalData,
} from './mock-hospital-data';
import { calculateTimeSlots } from './time-slot-engine';
import { calculateDoctorEarnings } from './doctor-earnings-engine';
import { calculateConsultationFrequency } from './consultation-frequency-engine';

export type { StoredAppointment, HospitalFixtureData };

export interface InMemoryAdapterConfig {
  seedDelayMs?: number;
  migrateDelayMs?: number;
  initialDbType?: 'MariaDB' | 'MongoDB' | null;
  isLoading?: boolean;
  fixtureMode?: 'minimal' | 'demo';
}

export const IN_MEMORY_ADAPTER_CONFIG = new InjectionToken<InMemoryAdapterConfig>(
  'IN_MEMORY_ADAPTER_CONFIG',
);

export interface TestHospitalDataOptions extends InMemoryAdapterConfig {
  dbType?: 'MariaDB' | 'MongoDB' | null;
}

@Injectable({
  providedIn: 'root',
})
export class InMemoryHospitalDataAdapter implements HospitalDataAccess {
  private readonly injector = inject(Injector);
  private readonly config = inject(IN_MEMORY_ADAPTER_CONFIG, { optional: true });
  private readonly stateVersion = signal(0);
  private readonly dbStatus = signal<'MariaDB' | 'MongoDB' | null>(
    this.config?.initialDbType !== undefined ? this.config.initialDbType : 'MariaDB',
  );

  private nextAppointmentId = 500;
  private doctors: Doctor[];
  private clerks: Clerk[];
  private patients: Patient[];
  private medications: Medication[];
  private appointments: StoredAppointment[];

  constructor() {
    const initial = this.loadFixtures();
    this.doctors = initial.doctors;
    this.clerks = initial.clerks;
    this.patients = initial.patients;
    this.medications = initial.medications;
    this.appointments = initial.appointments;
  }

  private loadFixtures(): HospitalFixtureData {
    return this.config?.fixtureMode === 'demo'
      ? createDemoHospitalData()
      : createMinimalHospitalData();
  }

  private resetFixtures(bumpVersion = true): void {
    this.nextAppointmentId = 500;
    const refreshed = this.loadFixtures();
    this.doctors = refreshed.doctors;
    this.clerks = refreshed.clerks;
    this.patients = refreshed.patients;
    this.medications = refreshed.medications;
    this.appointments = refreshed.appointments;
    if (bumpVersion) {
      this.stateVersion.update((v) => v + 1);
    }
  }

  getDoctors(): ResourceRef<Doctor[]> {
    return resource<Doctor[], number>({
      injector: this.injector,
      defaultValue: [],
      params: () => this.stateVersion(),
      loader: async () => [...this.doctors],
    });
  }

  searchPatients(query: Signal<string> | (() => string)): ResourceRef<Patient[]> {
    return resource<Patient[], { version: number; q: string } | undefined>({
      injector: this.injector,
      defaultValue: [],
      params: () => {
        const v = this.stateVersion();
        const raw = typeof query === 'function' ? query()?.trim() : '';
        if (!raw || raw.length < 2) return undefined;
        return { version: v, q: raw };
      },
      loader: async (ctx) => {
        const q = ctx.params?.q?.toLowerCase() ?? '';
        if (!q) return [];
        return this.patients.filter((p) => p.name.toLowerCase().includes(q) || p.ssn.includes(q));
      },
    });
  }

  getPatientDetails(
    patientId: Signal<string | number | null> | (() => string | number | null),
  ): ResourceRef<Patient | null> {
    return resource<Patient | null, { version: number; id: string } | undefined>({
      injector: this.injector,
      defaultValue: null,
      params: () => {
        const v = this.stateVersion();
        const id = typeof patientId === 'function' ? patientId() : null;
        if (!id) return undefined;
        return { version: v, id: String(id) };
      },
      loader: async (ctx) => {
        const id = ctx.params?.id;
        if (!id) return null;
        const patient = this.patients.find((p) => String(p.id) === id || p.ssn === id);
        return patient ? JSON.parse(JSON.stringify(patient)) : null;
      },
    });
  }

  searchClerks(query: Signal<string> | (() => string)): ResourceRef<Clerk[]> {
    return resource<Clerk[], { version: number; q: string }>({
      injector: this.injector,
      defaultValue: [],
      params: () => ({
        version: this.stateVersion(),
        q: typeof query === 'function' ? (query()?.trim() ?? '') : '',
      }),
      loader: async (ctx) => {
        const q = ctx.params?.q?.toLowerCase() ?? '';
        if (!q) return [...this.clerks];
        return this.clerks.filter((c) => c.name.toLowerCase().includes(q) || c.ssn.includes(q));
      },
    });
  }

  getTimeSlots(
    params: Signal<TimeSlotQueryParams | undefined> | (() => TimeSlotQueryParams | undefined),
  ): ResourceRef<TimeSlotsResult | undefined> {
    return resource<
      TimeSlotsResult | undefined,
      { version: number; p: TimeSlotQueryParams } | undefined
    >({
      injector: this.injector,
      params: () => {
        const v = this.stateVersion();
        const p = typeof params === 'function' ? params() : undefined;
        if (!p || !p.date || !p.doctorSsn) return undefined;
        return { version: v, p };
      },
      loader: async (ctx) => {
        if (!ctx.params?.p) return undefined;
        return this.calculateSlots(ctx.params.p);
      },
    });
  }

  getMedications(): ResourceRef<Medication[]> {
    return resource<Medication[], number>({
      injector: this.injector,
      defaultValue: [],
      params: () => this.stateVersion(),
      loader: async () => [...this.medications],
    });
  }

  getDoctorEarningsReport(
    year: Signal<number> | (() => number),
  ): ResourceRef<DoctorEarningsReport | undefined> {
    return resource<
      DoctorEarningsReport | undefined,
      { version: number; year: number } | undefined
    >({
      injector: this.injector,
      params: () => {
        const v = this.stateVersion();
        const y = typeof year === 'function' ? year() : undefined;
        if (y === undefined) return undefined;
        return { version: v, year: y };
      },
      loader: async (ctx) => {
        if (!ctx.params) return undefined;
        return this.calculateDoctorEarnings(ctx.params.year);
      },
    });
  }

  getConsultationFrequencyReport(
    dateRange: Signal<DateRange | undefined> | (() => DateRange | undefined),
  ): ResourceRef<ConsultationFrequencyReport | undefined> {
    return resource<
      ConsultationFrequencyReport | undefined,
      { version: number; range: DateRange } | undefined
    >({
      injector: this.injector,
      params: () => {
        const v = this.stateVersion();
        const r = typeof dateRange === 'function' ? dateRange() : undefined;
        if (!r || !r.startDate || !r.endDate) return undefined;
        return { version: v, range: r };
      },
      loader: async (ctx) => {
        if (!ctx.params?.range) return undefined;
        return this.calculateConsultationFrequency(ctx.params.range);
      },
    });
  }

  getPatientVisitsReport(
    dateRange: Signal<DateRange | undefined> | (() => DateRange | undefined),
  ): ResourceRef<PatientVisitsReport | undefined> {
    return this.getConsultationFrequencyReport(dateRange);
  }

  async bookAppointment(payload: CreateAppointmentRequest): Promise<CreateAppointmentResponse> {
    const rawDate = payload.date.split('T')[0];
    const time = payload.time;

    // Check for doctor or patient conflicts
    const conflict = this.appointments.find(
      (a) =>
        a.date === rawDate &&
        a.time === time &&
        (a.doctorSsn === payload.doctorSsn || a.patientSsn === payload.patientSsn),
    );

    if (conflict) {
      throw new BookingConflictError('The selected time slot was already booked by another user.');
    }

    const apptId = this.nextAppointmentId++;
    const stored: StoredAppointment = {
      id: apptId,
      date: rawDate,
      time: time,
      doctorSsn: payload.doctorSsn,
      patientSsn: payload.patientSsn,
      reason: payload.reason,
      clerkSsn: payload.clerkSsn,
    };

    this.appointments.push(stored);

    // Update patient's appointment record
    const patient = this.patients.find(
      (p) => p.ssn === payload.patientSsn || String(p.id) === payload.patientSsn,
    );
    const doctor = this.doctors.find((d) => d.ssn === payload.doctorSsn);
    const doctorName = doctor ? doctor.name : 'Attending Doctor';

    if (patient) {
      if (!patient.appointments) patient.appointments = [];
      patient.appointments.push({
        id: apptId,
        date: rawDate,
        time: time,
        doctorName: doctorName,
        reason: payload.reason ?? '',
      });
    }

    this.stateVersion.update((v) => v + 1);

    return {
      success: true,
      appointmentId: apptId,
      message: 'Appointment successfully scheduled',
      appointment: {
        patientSsn: payload.patientSsn,
        doctorSsn: payload.doctorSsn,
        date: rawDate,
        time: time,
        reason: payload.reason,
      },
    };
  }

  async addTreatment(
    patientId: string | number,
    appointmentId: number,
    treatment: Treatment,
  ): Promise<AddTreatmentResponse> {
    const appt = this.appointments.find((a) => a.id === appointmentId);
    if (appt) {
      appt.treatment = treatment;
    }

    const patient = this.patients.find(
      (p) => String(p.id) === String(patientId) || p.ssn === String(patientId),
    );
    if (patient && patient.appointments) {
      const patientAppt = patient.appointments.find((a) => a.id === appointmentId);
      if (patientAppt) {
        // Treatment recorded
      }
    }

    this.stateVersion.update((v) => v + 1);

    return { success: true };
  }

  private calculateSlots(p: TimeSlotQueryParams): TimeSlotsResult {
    return calculateTimeSlots(this.appointments, p);
  }

  private calculateDoctorEarnings(year: number): DoctorEarningsReport {
    return calculateDoctorEarnings(this.doctors, this.appointments, year);
  }

  private calculateConsultationFrequency(range: DateRange): ConsultationFrequencyReport {
    return calculateConsultationFrequency(
      this.appointments,
      this.patients,
      this.doctors,
      range,
    );
  }

  getDatabaseStatus(): ResourceRef<DbStatus | undefined> {
    if (this.config?.isLoading) {
      const isLoading = signal(true);
      const value = signal<DbStatus | undefined>(undefined);
      const hasValue = signal(false);
      const error = signal<unknown>(undefined);
      const status = signal<'idle' | 'loading' | 'resolved' | 'error'>('loading');
      return {
        value: value.asReadonly(),
        status: status.asReadonly(),
        error: error.asReadonly(),
        isLoading: isLoading.asReadonly(),
        hasValue: hasValue.asReadonly(),
        reload: () => false,
        destroy: () => {},
        set: () => {},
        update: () => {},
        snapshot: () => undefined,
        asReadonly() {
          return this;
        },
      } as unknown as ResourceRef<DbStatus | undefined>;
    }
    return resource<DbStatus | undefined, 'MariaDB' | 'MongoDB' | null>({
      injector: this.injector,
      params: () => this.dbStatus(),
      loader: async (ctx) => (ctx.params ? { dbType: ctx.params } : undefined),
    });
  }

  private async delay(ms?: number): Promise<void> {
    if (ms && ms > 0) {
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  async seedDatabase(): Promise<{ success: boolean; message: string }> {
    await this.delay(this.config?.seedDelayMs);
    this.resetFixtures(true);
    this.dbStatus.set('MariaDB');
    return {
      success: true,
      message: 'Database successfully populated with randomized test data.',
    };
  }

  async migrateDatabase(): Promise<{ success: boolean; message: string }> {
    await this.delay(this.config?.migrateDelayMs);
    this.dbStatus.set('MongoDB');
    return {
      success: true,
      message:
        'Migration completed! MariaDB records successfully transferred and switched to MongoDB.',
    };
  }
}

export function provideTestHospitalData(options?: TestHospitalDataOptions): Provider[] {
  const initialDbType =
    options?.initialDbType !== undefined
      ? options.initialDbType
      : options?.dbType !== undefined
        ? options.dbType
        : 'MariaDB';

  const config: InMemoryAdapterConfig = {
    seedDelayMs: options?.seedDelayMs ?? 0,
    migrateDelayMs: options?.migrateDelayMs ?? 0,
    initialDbType,
    isLoading: options?.isLoading ?? false,
    fixtureMode: options?.fixtureMode ?? 'minimal',
  };
  return [
    { provide: IN_MEMORY_ADAPTER_CONFIG, useValue: config },
    { provide: HOSPITAL_DATA_ACCESS, useClass: InMemoryHospitalDataAdapter },
  ];
}
