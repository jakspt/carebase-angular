import {
  Injectable,
  InjectionToken,
  Injector,
  PendingTasks,
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
} from '../../models/models';
import {
  AddTreatmentResponse,
  AppointmentConflictError,
  ConsultationFrequencyReport,
  DateRange,
  DoctorEarningsReport,
  HospitalDataAccess,
  PatientVisitsReport,
  TimeSlotQueryParams,
  TimeSlotsResult,
  provideHospitalDataAccessProviders,
} from './hospital-data-access';
import {
  HospitalFixtureData,
  StoredAppointment,
  createDemoHospitalData,
  createMinimalHospitalData,
} from './mock-hospital-data';
import { calculateTimeSlots } from '../engines/time-slot-engine';
import { calculateDoctorEarnings } from '../engines/doctor-earnings-engine';
import { calculateConsultationFrequency } from '../engines/consultation-frequency-engine';

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

  private createQueryResource<T, P>(
    params: () => P,
    loader: (p: P) => Promise<T>,
    defaultValue: T,
    customInjector?: Injector,
  ): ResourceRef<T>;
  private createQueryResource<T, P>(
    params: () => P,
    loader: (p: P) => Promise<T>,
    defaultValue?: undefined,
    customInjector?: Injector,
  ): ResourceRef<T | undefined>;
  private createQueryResource<T, P>(
    params: () => P,
    loader: (p: P) => Promise<T>,
    defaultValue?: T,
    customInjector?: Injector,
  ): ResourceRef<T> {
    const injector = customInjector ?? this.injector;
    if (defaultValue !== undefined) {
      return resource<T, P>({
        injector,
        params,
        loader: async (ctx) => loader(ctx.params),
        defaultValue,
      });
    }
    return resource<T | undefined, P>({
      injector,
      params,
      loader: async (ctx) => loader(ctx.params),
    }) as unknown as ResourceRef<T>;
  }

  getDoctors(): ResourceRef<Doctor[]> {
    return this.createQueryResource(
      () => this.stateVersion(),
      async () => [...this.doctors],
      [],
    );
  }

  searchPatients(query: Signal<string> | (() => string)): ResourceRef<Patient[]> {
    return this.createQueryResource(
      () => {
        const v = this.stateVersion();
        const raw = typeof query === 'function' ? query()?.trim() : '';
        if (!raw || raw.length < 2) return undefined;
        return { version: v, q: raw };
      },
      async (ctxParams) => {
        const q = ctxParams?.q?.toLowerCase() ?? '';
        if (!q) return [];
        return this.patients.filter((p) => p.name.toLowerCase().includes(q) || p.ssn.includes(q));
      },
      [],
    );
  }

  getPatientDetails(
    patientId: Signal<string | number | null> | (() => string | number | null),
  ): ResourceRef<Patient | null> {
    return this.createQueryResource<
      Patient | null,
      { version: number; id: string } | undefined
    >(
      () => {
        const v = this.stateVersion();
        const id = typeof patientId === 'function' ? patientId() : null;
        if (!id) return undefined;
        return { version: v, id: String(id) };
      },
      async (ctxParams) => {
        const id = ctxParams?.id;
        if (!id) return null;
        const patient = this.patients.find((p) => String(p.id) === id || p.ssn === id);
        return patient ? JSON.parse(JSON.stringify(patient)) : null;
      },
      null,
    );
  }

  searchClerks(query: Signal<string> | (() => string)): ResourceRef<Clerk[]> {
    return this.createQueryResource(
      () => ({
        version: this.stateVersion(),
        q: typeof query === 'function' ? (query()?.trim() ?? '') : '',
      }),
      async (ctxParams) => {
        const q = ctxParams.q.toLowerCase();
        if (!q) return [...this.clerks];
        return this.clerks.filter((c) => c.name.toLowerCase().includes(q) || c.ssn.includes(q));
      },
      [],
    );
  }

  getTimeSlots(
    params: Signal<TimeSlotQueryParams | undefined> | (() => TimeSlotQueryParams | undefined),
  ): ResourceRef<TimeSlotsResult | undefined> {
    return this.createQueryResource(
      () => {
        const v = this.stateVersion();
        const p = typeof params === 'function' ? params() : undefined;
        if (!p || !p.date || !p.doctorSsn) return undefined;
        return { version: v, p };
      },
      async (ctxParams) => {
        if (!ctxParams?.p) return undefined;
        return calculateTimeSlots(this.appointments, ctxParams.p);
      },
    );
  }

  getMedications(): ResourceRef<Medication[]> {
    return this.createQueryResource(
      () => this.stateVersion(),
      async () => [...this.medications],
      [],
    );
  }

  getDoctorEarningsReport(
    year: Signal<number> | (() => number),
  ): ResourceRef<DoctorEarningsReport | undefined> {
    return this.createQueryResource(
      () => {
        const v = this.stateVersion();
        const y = typeof year === 'function' ? year() : undefined;
        if (y === undefined) return undefined;
        return { version: v, year: y };
      },
      async (ctxParams) => {
        if (!ctxParams) return undefined;
        return calculateDoctorEarnings(this.doctors, this.appointments, ctxParams.year);
      },
    );
  }

  getConsultationFrequencyReport(
    dateRange: Signal<DateRange | undefined> | (() => DateRange | undefined),
  ): ResourceRef<ConsultationFrequencyReport | undefined> {
    return this.createQueryResource(
      () => {
        const v = this.stateVersion();
        const r = typeof dateRange === 'function' ? dateRange() : undefined;
        if (!r || !r.startDate || !r.endDate) return undefined;
        return { version: v, range: r };
      },
      async (ctxParams) => {
        if (!ctxParams?.range) return undefined;
        return calculateConsultationFrequency(
          this.appointments,
          this.patients,
          this.doctors,
          ctxParams.range,
        );
      },
    );
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
      throw new AppointmentConflictError(
        'The selected time slot was already booked by another user.',
      );
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

  getDatabaseStatus(): ResourceRef<DbStatus | undefined> {
    const customInjector = this.config?.isLoading
      ? Injector.create({
          parent: this.injector,
          providers: [
            {
              provide: PendingTasks,
              useValue: { add: () => () => {}, run: (fn: any) => fn() },
            },
          ],
        })
      : undefined;

    return this.createQueryResource(
      () => this.dbStatus(),
      async (status) => {
        if (this.config?.isLoading) {
          return new Promise<never>(() => {});
        }
        return status ? { dbType: status } : undefined;
      },
      undefined,
      customInjector,
    );
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
    ...provideHospitalDataAccessProviders(InMemoryHospitalDataAdapter),
  ];
}
