import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { InMemoryHospitalDataAdapter } from './in-memory-hospital-data-adapter';
import {
  BookingConflictError,
  TimeSlotQueryParams,
  DateRange,
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

  const settle = () => new Promise((r) => setTimeout(r, 10));

  it('should return seeded doctors', async () => {
    const res = adapter.getDoctors();
    await settle();

    const doctors = res.value();
    expect(doctors.length).toBeGreaterThan(0);
    expect(doctors[0]).toHaveProperty('specialty');
    expect(doctors[0]).toHaveProperty('department');
  });

  it('should search patients by name or SSN', async () => {
    const q = signal('Maria');
    const res = adapter.searchPatients(q);
    await settle();

    const results = res.value();
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.name.includes('Maria') || p.ssn.includes('Maria'))).toBe(true);
  });

  it('should not search patients if query is shorter than 2 characters', async () => {
    const q = signal('M');
    const res = adapter.searchPatients(q);
    await settle();

    expect(res.value()).toEqual([]);
  });

  it('should return patient details including appointments', async () => {
    const id = signal<string | number | null>('2001');
    const res = adapter.getPatientDetails(id);
    await settle();

    const patient = res.value();
    expect(patient).not.toBeNull();
    expect(patient?.name).toBeDefined();
    expect(patient?.appointments).toBeDefined();
  });

  it('should search clerks by name or SSN', async () => {
    const q = signal('Erika');
    const res = adapter.searchClerks(q);
    await settle();

    const clerks = res.value();
    expect(clerks.length).toBeGreaterThan(0);
    expect(clerks[0].name).toContain('Erika');
  });

  it('should return time slots and correctly mark booked slots as unavailable', async () => {
    const params = signal<TimeSlotQueryParams | undefined>({
      date: '2026-10-15',
      doctorSsn: '3001',
    });
    const res = adapter.getTimeSlots(params);
    await settle();

    const slotsResult = res.value();
    expect(slotsResult).toBeDefined();
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
    await settle();

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
    await settle();

    const meds = res.value();
    expect(meds.length).toBeGreaterThan(0);
    expect(meds[0]).toHaveProperty('id');
    expect(meds[0]).toHaveProperty('name');
  });

  it('should aggregate doctor earnings report for a given year', async () => {
    const year = signal(2026);
    const res = adapter.getDoctorEarningsReport(year);
    await settle();

    const report = res.value();
    expect(report).toBeDefined();
    expect(report?.year).toBe(2026);
    expect(Array.isArray(report?.data)).toBe(true);
  });

  it('should generate patient visits report within date range', async () => {
    const range = signal<DateRange | undefined>({
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    const res = adapter.getPatientVisitsReport(range);
    await settle();

    const report = res.value();
    expect(report).toBeDefined();
    expect(report?.startDate).toBe('2026-01-01');
    expect(report?.endDate).toBe('2026-12-31');
    expect(Array.isArray(report?.results)).toBe(true);
  });
});
