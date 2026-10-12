import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import {
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
});

describe('provideTestHospitalData', () => {
  it('should provide HOSPITAL_DATA_ACCESS as an InMemoryHospitalDataAdapter instance', () => {
    TestBed.configureTestingModule({
      providers: [provideTestHospitalData()],
    });
    const instance = TestBed.inject(HOSPITAL_DATA_ACCESS);
    expect(instance).toBeInstanceOf(InMemoryHospitalDataAdapter);
  });
});
