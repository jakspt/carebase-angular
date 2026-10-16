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
  TimeSlot,
  PatientVisitRecord,
  DoctorEarnings,
  DbStatus,
} from '../models/models';
import {
  AddTreatmentResponse,
  BookingConflictError,
  DateRange,
  DoctorEarningsReport,
  HOSPITAL_DATA_ACCESS,
  HospitalDataAccess,
  PatientVisitsReport,
  TimeSlotQueryParams,
  TimeSlotsResult,
} from './hospital-data-access';

export interface InMemoryAdapterConfig {
  seedDelayMs?: number;
  migrateDelayMs?: number;
  initialDbType?: 'MariaDB' | 'MongoDB' | null;
  isLoading?: boolean;
}

export const IN_MEMORY_ADAPTER_CONFIG = new InjectionToken<InMemoryAdapterConfig>(
  'IN_MEMORY_ADAPTER_CONFIG',
);

export interface TestHospitalDataOptions extends InMemoryAdapterConfig {
  dbType?: 'MariaDB' | 'MongoDB' | null;
}

interface StoredAppointment {
  id: number;
  date: string;
  time: string;
  doctorSsn: string;
  patientSsn: string;
  reason?: string;
  clerkSsn?: string;
  treatment?: Treatment;
}

function createInitialDoctors(): Doctor[] {
  return [
    {
      id: '3001',
      name: 'Dr. Alexander Weber',
      ssn: '3001',
      specialty: 'Cardiology',
      position: 'Chief of Department',
      department: 'Cardiology',
    },
    {
      id: '3002',
      name: 'Dr. Sarah Jenkins',
      ssn: '3002',
      specialty: 'Neurology',
      position: 'Attending',
      department: 'Neurology',
    },
    {
      id: '3003',
      name: 'Dr. Michael Chen',
      ssn: '3003',
      specialty: 'Orthopedics',
      position: 'Senior Resident',
      department: 'Orthopedics',
    },
  ];
}

function createInitialClerks(): Clerk[] {
  return [
    { id: '1001', name: 'Erika Mustermann', ssn: '1001' },
    { id: '1002', name: 'Max Mustermann', ssn: '1002' },
  ];
}

function createInitialPatients(): Patient[] {
  return [
    {
      id: '2001',
      name: 'Maria Gruber',
      ssn: '2001',
      insurance: 'ÖGK',
      nacaScore: 1,
      appointments: [
        {
          id: 101,
          date: '2026-09-10',
          time: '09:00',
          doctorName: 'Dr. Alexander Weber',
          reason: 'Initial consultation',
        },
      ],
    },
    {
      id: '2002',
      name: 'Johann Schmidt',
      ssn: '2002',
      insurance: 'BVAEB',
      nacaScore: 2,
      appointments: [],
    },
    {
      id: '2003',
      name: 'Anna Fischer',
      ssn: '2003',
      insurance: 'SVS',
      nacaScore: 0,
      appointments: [],
    },
  ];
}

function createInitialMedications(): Medication[] {
  return [
    { id: 1, name: 'Aspirin' },
    { id: 2, name: 'Paracetamol' },
    { id: 3, name: 'Ibuprofen' },
    { id: 4, name: 'Amoxicillin' },
    { id: 5, name: 'Metformin' },
  ];
}

function createInitialAppointments(): StoredAppointment[] {
  return [
    {
      id: 101,
      date: '2026-09-10',
      time: '09:00',
      doctorSsn: '3001',
      patientSsn: '2001',
      reason: 'Initial consultation',
      treatment: {
        description: 'Echocardiogram',
        cost: 250,
        medications: [{ id: 1, name: 'Aspirin' }],
      },
    },
    {
      id: 102,
      date: '2026-10-15',
      time: '09:00',
      doctorSsn: '3001',
      patientSsn: '2002',
      reason: 'Routine checkup',
    },
  ];
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
  private doctors: Doctor[] = createInitialDoctors();
  private clerks: Clerk[] = createInitialClerks();
  private patients: Patient[] = createInitialPatients();
  private medications: Medication[] = createInitialMedications();
  private appointments: StoredAppointment[] = createInitialAppointments();

  private resetFixtures(bumpVersion = true): void {
    this.nextAppointmentId = 500;
    this.doctors = createInitialDoctors();
    this.clerks = createInitialClerks();
    this.patients = createInitialPatients();
    this.medications = createInitialMedications();
    this.appointments = createInitialAppointments();
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

  getPatientVisitsReport(
    dateRange: Signal<DateRange | undefined> | (() => DateRange | undefined),
  ): ResourceRef<PatientVisitsReport | undefined> {
    return resource<
      PatientVisitsReport | undefined,
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
        return this.calculatePatientVisits(ctx.params.range);
      },
    });
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
    const rawDate = p.date.split('T')[0];
    const unavailableSlots = new Set<string>();

    for (const a of this.appointments) {
      if (a.date === rawDate) {
        if (a.doctorSsn === p.doctorSsn || (p.patientSsn && a.patientSsn === p.patientSsn)) {
          unavailableSlots.add(a.time);
        }
      }
    }

    const slots: TimeSlot[] = [];
    for (let hour = 8; hour < 18; hour++) {
      for (const minute of [0, 30]) {
        if (hour === 17 && minute === 30) continue;
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeStr,
          available: !unavailableSlots.has(timeStr),
        });
      }
    }

    let nextAvailableDate: string | null = null;
    const hasAvailable = slots.some((s) => s.available);
    if (!hasAvailable) {
      try {
        const parts = rawDate.split('-');
        const curr = new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10),
        );
        const SLOTS_PER_DAY = 19;
        for (let offset = 1; offset <= 14; offset++) {
          const candidate = new Date(curr);
          candidate.setDate(curr.getDate() + offset);
          const year = candidate.getFullYear();
          const month = String(candidate.getMonth() + 1).padStart(2, '0');
          const day = String(candidate.getDate()).padStart(2, '0');
          const candidateStr = `${year}-${month}-${day}`;
          const bookedOnCandidate = this.appointments.filter(
            (a) =>
              a.date === candidateStr &&
              (a.doctorSsn === p.doctorSsn || (p.patientSsn && a.patientSsn === p.patientSsn)),
          ).length;
          if (bookedOnCandidate < SLOTS_PER_DAY) {
            nextAvailableDate = candidateStr;
            break;
          }
        }
      } catch {
        // ignore date parse issues
      }
    }

    return {
      date: rawDate,
      doctorSsn: p.doctorSsn,
      patientSsn: p.patientSsn,
      slots,
      nextAvailableDate,
    };
  }

  private calculateDoctorEarnings(year: number): DoctorEarningsReport {
    const data: DoctorEarnings[] = this.doctors.map((doctor) => {
      let total = 0;
      for (const appt of this.appointments) {
        if (appt.doctorSsn === doctor.ssn && appt.date.startsWith(String(year)) && appt.treatment) {
          total += appt.treatment.cost;
        }
      }
      return {
        id: Number(doctor.id),
        name: doctor.name,
        specialty: doctor.specialty,
        department: doctor.department,
        year,
        totalCosts: total,
      };
    });

    return {
      year,
      data,
    };
  }

  private calculatePatientVisits(range: DateRange): PatientVisitsReport {
    const counts = new Map<string, { patientSsn: string; doctorSsn: string; count: number }>();

    for (const appt of this.appointments) {
      if (appt.date >= range.startDate && appt.date <= range.endDate) {
        const key = `${appt.patientSsn}_${appt.doctorSsn}`;
        const existing = counts.get(key);
        if (existing) {
          existing.count++;
        } else {
          counts.set(key, {
            patientSsn: appt.patientSsn,
            doctorSsn: appt.doctorSsn,
            count: 1,
          });
        }
      }
    }

    const results: PatientVisitRecord[] = Array.from(counts.values()).map((item) => {
      const patient = this.patients.find((p) => p.ssn === item.patientSsn);
      const doctor = this.doctors.find((d) => d.ssn === item.doctorSsn);

      return {
        patientSsn: item.patientSsn,
        patientName: patient?.name ?? 'Unknown Patient',
        insurance: patient?.insurance ?? '',
        doctorSsn: item.doctorSsn,
        doctorName: doctor?.name ?? 'Unknown Doctor',
        specialty: doctor?.specialty ?? '',
        department: doctor?.department ?? '',
        visitCount: item.count,
      };
    });

    return {
      startDate: range.startDate,
      endDate: range.endDate,
      results,
    };
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
  };
  return [
    { provide: IN_MEMORY_ADAPTER_CONFIG, useValue: config },
    { provide: HOSPITAL_DATA_ACCESS, useClass: InMemoryHospitalDataAdapter },
  ];
}
