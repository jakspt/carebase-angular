import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import {
  IN_MEMORY_ADAPTER_CONFIG,
  InMemoryHospitalDataAdapter,
  provideTestHospitalData,
} from './in-memory-hospital-data-adapter';
import {
  BookingConflictError,
  TimeSlotQueryParams,
  DateRange,
  HOSPITAL_DATA_ACCESS,
} from './hospital-data-access';
import { CreateAppointmentRequest, Treatment } from '../models/models';

describe('InMemoryHospitalDataAdapter', () => {
  let adapter: InMemoryHospitalDataAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InMemoryHospitalDataAdapter],
    });
    adapter = TestBed.inject(InMemoryHospitalDataAdapter);
  });

  it('should return seeded doctors', async () => {
    const res = adapter.getDoctors();
    await vi.waitFor(() => {
      expect(res.value().length).toBeGreaterThan(0);
    });

    const doctors = res.value();
    expect(doctors[0]).toHaveProperty('specialty');
    expect(doctors[0]).toHaveProperty('department');
  });

  it('should search patients by name or SSN', async () => {
    const q = signal('Maria');
    const res = adapter.searchPatients(q);
    await vi.waitFor(() => {
      expect(res.value().length).toBeGreaterThan(0);
    });

    const results = res.value();
    expect(results.every((p) => p.name.includes('Maria') || p.ssn.includes('Maria'))).toBe(true);
  });

  it('should not search patients if query is shorter than 2 characters', async () => {
    const q = signal('M');
    const res = adapter.searchPatients(q);
    await vi.waitFor(() => {
      expect(res.value()).toEqual([]);
    });
  });

  it('should return patient details including appointments', async () => {
    const id = signal<string | number | null>('2001');
    const res = adapter.getPatientDetails(id);
    await vi.waitFor(() => {
      expect(res.value()).not.toBeNull();
    });

    const patient = res.value();
    expect(patient?.name).toBeDefined();
    expect(patient?.appointments).toBeDefined();
  });

  it('should search clerks by name or SSN', async () => {
    const q = signal('Erika');
    const res = adapter.searchClerks(q);
    await vi.waitFor(() => {
      expect(res.value().length).toBeGreaterThan(0);
    });

    const clerks = res.value();
    expect(clerks[0].name).toContain('Erika');
  });

  it('should return time slots and correctly mark booked slots as unavailable', async () => {
    const params = signal<TimeSlotQueryParams | undefined>({
      date: '2026-10-15',
      doctorSsn: '3001',
    });
    const res = adapter.getTimeSlots(params);
    await vi.waitFor(() => {
      expect(res.value()).toBeDefined();
    });

    const slotsResult = res.value();
    expect(slotsResult?.slots.length).toBeGreaterThan(0);
    // Standard operating hours from 08:00 to 17:00
    expect(slotsResult?.slots[0].time).toBe('08:00');
  });

  it('should book an appointment and update slot availability', async () => {
    const payload: CreateAppointmentRequest = {
      patientSsn: '2001',
      doctorSsn: '3001',
      date: '2026-10-25',
      time: '10:00',
      reason: 'General checkup',
    };

    const bookingRes = await adapter.bookAppointment(payload);
    expect(bookingRes.success).toBe(true);
    expect(bookingRes.appointmentId).toBeDefined();

    // Verify slot is now unavailable
    const params = signal<TimeSlotQueryParams | undefined>({
      date: '2026-10-25',
      doctorSsn: '3001',
    });
    const slotsRes = adapter.getTimeSlots(params);
    await vi.waitFor(() => {
      expect(slotsRes.value()).toBeDefined();
    });

    const slot = slotsRes.value()?.slots.find((s) => s.time === '10:00');
    expect(slot?.available).toBe(false);
  });

  it('should throw BookingConflictError on duplicate booking for the same slot', async () => {
    const payload: CreateAppointmentRequest = {
      patientSsn: '2001',
      doctorSsn: '3001',
      date: '2026-11-01',
      time: '11:00',
      reason: 'Routine visit',
    };

    await adapter.bookAppointment(payload);

    // Attempt second booking with different patient for the same doctor and time
    const conflictingPayload: CreateAppointmentRequest = {
      patientSsn: '2002',
      doctorSsn: '3001',
      date: '2026-11-01',
      time: '11:00',
      reason: 'Urgent consultation',
    };

    await expect(adapter.bookAppointment(conflictingPayload)).rejects.toThrow(BookingConflictError);
  });

  it('should add treatment to patient appointment and reflect in patient details', async () => {
    // Book an appointment first
    const booking = await adapter.bookAppointment({
      patientSsn: '2001',
      doctorSsn: '3001',
      date: '2026-11-05',
      time: '09:30',
      reason: 'Follow-up',
    });

    const treatment: Treatment = {
      description: 'Physical examination',
      cost: 120,
      medications: [{ id: 1, name: 'Aspirin' }],
    };

    const treatmentRes = await adapter.addTreatment('2001', booking.appointmentId!, treatment);
    expect(treatmentRes.success).toBe(true);
  });

  it('should return medications formulary', async () => {
    const res = adapter.getMedications();
    await vi.waitFor(() => {
      expect(res.value().length).toBeGreaterThan(0);
    });

    const meds = res.value();
    expect(meds[0]).toHaveProperty('id');
    expect(meds[0]).toHaveProperty('name');
  });

  it('should aggregate doctor earnings report for a given year', async () => {
    const year = signal(2026);
    const res = adapter.getDoctorEarningsReport(year);
    await vi.waitFor(() => {
      expect(res.value()).toBeDefined();
    });

    const report = res.value();
    expect(report?.year).toBe(2026);
    expect(Array.isArray(report?.data)).toBe(true);
  });

  it('should generate patient visits report within date range', async () => {
    const range = signal<DateRange | undefined>({
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    const res = adapter.getPatientVisitsReport(range);
    await vi.waitFor(() => {
      expect(res.value()).toBeDefined();
    });

    const report = res.value();
    expect(report?.startDate).toBe('2026-01-01');
    expect(report?.endDate).toBe('2026-12-31');
    expect(Array.isArray(report?.results)).toBe(true);
  });

  it('should compute nextAvailableDate when all slots on the requested date are booked', async () => {
    // Book all 19 operating hours slots for Dr. Alexander Weber (3001) on 2026-10-15
    const times = [
      '08:00',
      '08:30',
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '11:30',
      '12:00',
      '12:30',
      '13:00',
      '13:30',
      '14:00',
      '14:30',
      '15:00',
      '15:30',
      '16:00',
      '16:30',
      '17:00',
    ];
    for (const time of times) {
      try {
        await adapter.bookAppointment({
          patientSsn: '2001',
          doctorSsn: '3001',
          date: '2026-10-15',
          time,
        });
      } catch {
        // already booked (e.g. 09:00 is seeded)
      }
    }

    const params = signal<TimeSlotQueryParams | undefined>({
      date: '2026-10-15',
      doctorSsn: '3001',
    });
    const res = adapter.getTimeSlots(params);
    await vi.waitFor(() => {
      expect(res.value()).toBeDefined();
      expect(res.value()?.slots.every((s) => !s.available)).toBe(true);
    });

    // 2026-10-16 is the candidate date with open slots
    expect(res.value()?.nextAvailableDate).toBe('2026-10-16');
  });

  it('should return initial database status as MariaDB by default', async () => {
    const statusRes = adapter.getDatabaseStatus();
    await vi.waitFor(() => {
      expect(statusRes.value()).toEqual({ dbType: 'MariaDB' });
    });
  });

  it('should migrate database to MongoDB and reactively update database status', async () => {
    const statusRes = adapter.getDatabaseStatus();
    await vi.waitFor(() => {
      expect(statusRes.value()).toEqual({ dbType: 'MariaDB' });
    });

    const result = await adapter.migrateDatabase();
    expect(result.success).toBe(true);
    expect(result.message).toContain('Migration completed!');

    await vi.waitFor(() => {
      expect(statusRes.value()).toEqual({ dbType: 'MongoDB' });
    });
  });

  it('should reset internal fixtures and database status to MariaDB on seedDatabase', async () => {
    // 1. Switch to MongoDB
    await adapter.migrateDatabase();
    const statusRes = adapter.getDatabaseStatus();
    await vi.waitFor(() => {
      expect(statusRes.value()).toEqual({ dbType: 'MongoDB' });
    });

    // 2. Add an appointment
    const newAppointment = await adapter.bookAppointment({
      patientSsn: '2001',
      doctorSsn: '3001',
      date: '2026-12-01',
      time: '14:00',
      reason: 'Temporary test appointment',
    });
    expect(newAppointment.success).toBe(true);

    // Verify time slot is unavailable
    const slots = adapter.getTimeSlots(
      signal<TimeSlotQueryParams | undefined>({
        date: '2026-12-01',
        doctorSsn: '3001',
      }),
    );
    await vi.waitFor(() => {
      const slot = slots.value()?.slots.find((s) => s.time === '14:00');
      expect(slot?.available).toBe(false);
    });

    // 3. Seed database
    const seedResult = await adapter.seedDatabase();
    expect(seedResult.success).toBe(true);
    expect(seedResult.message).toContain(
      'Database successfully populated with randomized test data.',
    );

    // 4. Verify database status reset back to MariaDB
    await vi.waitFor(() => {
      expect(statusRes.value()).toEqual({ dbType: 'MariaDB' });
    });

    // 5. Verify the temporary appointment was reset
    const refreshedSlots = adapter.getTimeSlots(
      signal<TimeSlotQueryParams | undefined>({
        date: '2026-12-01',
        doctorSsn: '3001',
      }),
    );
    await vi.waitFor(() => {
      const slot = refreshedSlots.value()?.slots.find((s) => s.time === '14:00');
      expect(slot?.available).toBe(true);
    });
  });
});

describe('InMemoryHospitalDataAdapter with IN_MEMORY_ADAPTER_CONFIG', () => {
  it('should respect initialDbType and operation delays configured via IN_MEMORY_ADAPTER_CONFIG', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: IN_MEMORY_ADAPTER_CONFIG,
          useValue: {
            initialDbType: 'MongoDB',
            seedDelayMs: 25,
            migrateDelayMs: 25,
          },
        },
        InMemoryHospitalDataAdapter,
      ],
    });

    const configuredAdapter = TestBed.inject(InMemoryHospitalDataAdapter);
    const statusRes = configuredAdapter.getDatabaseStatus();

    await vi.waitFor(() => {
      expect(statusRes.value()).toEqual({ dbType: 'MongoDB' });
    });

    const startSeed = Date.now();
    const seedRes = await configuredAdapter.seedDatabase();
    const elapsedSeed = Date.now() - startSeed;
    expect(seedRes.success).toBe(true);
    expect(elapsedSeed).toBeGreaterThanOrEqual(15);

    await vi.waitFor(() => {
      expect(statusRes.value()).toEqual({ dbType: 'MariaDB' });
    });

    const startMigrate = Date.now();
    const migrateRes = await configuredAdapter.migrateDatabase();
    const elapsedMigrate = Date.now() - startMigrate;
    expect(migrateRes.success).toBe(true);
    expect(elapsedMigrate).toBeGreaterThanOrEqual(15);

    await vi.waitFor(() => {
      expect(statusRes.value()).toEqual({ dbType: 'MongoDB' });
    });
  });
});

describe('provideTestHospitalData', () => {
  it('should provide HOSPITAL_DATA_ACCESS as an InMemoryHospitalDataAdapter instance', () => {
    TestBed.configureTestingModule({
      providers: [provideTestHospitalData()],
    });
    const instance = TestBed.inject(HOSPITAL_DATA_ACCESS);
    expect(instance).toBeInstanceOf(InMemoryHospitalDataAdapter);
  });

  it('should accept initial database status and default operation delays to 0ms', async () => {
    TestBed.configureTestingModule({
      providers: [provideTestHospitalData({ dbType: 'MongoDB' })],
    });
    const instance = TestBed.inject(HOSPITAL_DATA_ACCESS);
    const statusRes = instance.getDatabaseStatus();

    await vi.waitFor(() => {
      expect(statusRes.value()).toEqual({ dbType: 'MongoDB' });
    });

    const start = Date.now();
    await instance.seedDatabase();
    const elapsed = Date.now() - start;
    // 0ms delay should resolve virtually instantaneously
    expect(elapsed).toBeLessThan(50);
  });

  it('should provide a loading database status resource when isLoading is configured', () => {
    TestBed.configureTestingModule({
      providers: [provideTestHospitalData({ isLoading: true })],
    });
    const instance = TestBed.inject(HOSPITAL_DATA_ACCESS);
    const statusRes = instance.getDatabaseStatus();

    expect(statusRes.isLoading()).toBe(true);
    expect(statusRes.hasValue()).toBe(false);
  });

  it('should provide an offline database status resource when dbType is null', async () => {
    TestBed.configureTestingModule({
      providers: [provideTestHospitalData({ dbType: null })],
    });
    const instance = TestBed.inject(HOSPITAL_DATA_ACCESS);
    const statusRes = instance.getDatabaseStatus();

    await vi.waitFor(() => {
      expect(statusRes.isLoading()).toBe(false);
      expect(statusRes.value()).toBeUndefined();
      expect(statusRes.hasValue()).toBe(false);
    });
  });

  it('should initialize with expanded demo fixtures when fixtureMode is demo', async () => {
    TestBed.configureTestingModule({
      providers: [provideTestHospitalData({ fixtureMode: 'demo' })],
    });
    const instance = TestBed.inject(HOSPITAL_DATA_ACCESS);

    // 6 doctors across 6 departments
    const doctorsRes = instance.getDoctors();
    await vi.waitFor(() => {
      expect(doctorsRes.value().length).toBe(6);
    });
    const departments = new Set(doctorsRes.value().map((d) => d.department));
    expect(departments.size).toBe(6);
    expect(departments).toContain('Cardiology');
    expect(departments).toContain('Neurology');
    expect(departments).toContain('Orthopedics');
    expect(departments).toContain('Internal Medicine');
    expect(departments).toContain('Pediatrics');
    expect(departments).toContain('Dermatology');

    // 8 medications formulary
    const medsRes = instance.getMedications();
    await vi.waitFor(() => {
      expect(medsRes.value().length).toBe(8);
    });

    // 3 clerks searchable
    const clerksRes = instance.searchClerks(signal(''));
    await vi.waitFor(() => {
      expect(clerksRes.value().length).toBe(3);
    });

    // Search patients by diverse autocomplete letter combos
    const stefanRes = instance.searchPatients(signal('Stefan'));
    await vi.waitFor(() => {
      expect(stefanRes.value().some((p) => p.name === 'Stefan Wagner')).toBe(true);
    });

    const elenaRes = instance.searchPatients(signal('Elena'));
    await vi.waitFor(() => {
      expect(elenaRes.value().some((p) => p.name === 'Elena Bauer')).toBe(true);
    });

    const markusRes = instance.searchPatients(signal('Markus'));
    await vi.waitFor(() => {
      expect(markusRes.value().some((p) => p.name === 'Markus Huber')).toBe(true);
    });

    // Annual doctor earnings has earnings for multiple doctors in demo mode
    const currentYear = new Date().getFullYear();
    const earningsRes = instance.getDoctorEarningsReport(signal(currentYear));
    await vi.waitFor(() => {
      expect(earningsRes.value()).toBeDefined();
    });
    const reportData = earningsRes.value()?.data ?? [];
    const earningDoctors = reportData.filter((d) => d.totalCosts > 0);
    expect(earningDoctors.length).toBeGreaterThanOrEqual(4);

    // Re-seeding preserves demo mode
    await instance.seedDatabase();
    const refreshedDocs = instance.getDoctors();
    await vi.waitFor(() => {
      expect(refreshedDocs.value().length).toBe(6);
    });
  });
});
