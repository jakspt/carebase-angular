import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpHospitalDataAdapter } from './http-hospital-data-adapter';
import {
  BookingConflictError,
  HospitalDataError,
  TimeSlotQueryParams,
  DateRange,
} from './hospital-data-access';
import { CreateAppointmentRequest, Treatment } from '../models/models';

describe('HttpHospitalDataAdapter', () => {
  let adapter: HttpHospitalDataAdapter;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpHospitalDataAdapter, provideHttpClient(), provideHttpClientTesting()],
    });

    adapter = TestBed.inject(HttpHospitalDataAdapter);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('getDoctors', () => {
    it('should query /api/clerk/doctors and unwrap response envelope via parse', async () => {
      const res = adapter.getDoctors();
      TestBed.tick();

      const req = httpTesting.expectOne('/api/clerk/doctors');
      expect(req.request.method).toBe('GET');

      req.flush({
        doctors: [
          {
            id: '1001',
            name: 'Dr. Jane Smith',
            ssn: '1001',
            specialty: 'Cardiology',
            position: 'Chief',
            department: 'Cardiology',
          },
        ],
      });
      await vi.waitFor(() => {
        expect(res.value()).toEqual([
          {
            id: '1001',
            name: 'Dr. Jane Smith',
            ssn: '1001',
            specialty: 'Cardiology',
            position: 'Chief',
            department: 'Cardiology',
          },
        ]);
      });
    });
  });

  describe('searchPatients', () => {
    it('should query /api/clerk/patients/search with query param and unwrap envelope', async () => {
      const q = signal('Jane');
      const res = adapter.searchPatients(q);
      TestBed.tick();

      const req = httpTesting.expectOne('/api/clerk/patients/search?q=Jane');
      expect(req.request.method).toBe('GET');

      req.flush({
        patients: [{ id: '1', name: 'Jane Doe', ssn: '1234', insurance: 'HealthCare' }],
      });
      await vi.waitFor(() => {
        expect(res.value()).toEqual([
          { id: '1', name: 'Jane Doe', ssn: '1234', insurance: 'HealthCare' },
        ]);
      });
    });

    it('should not query when search string is fewer than 2 characters', async () => {
      const q = signal('J');
      const res = adapter.searchPatients(q);
      TestBed.tick();

      httpTesting.expectNone((r) => r.url.includes('/api/clerk/patients/search'));
      await vi.waitFor(() => {
        expect(res.value()).toEqual([]);
      });
    });
  });

  describe('getPatientDetails', () => {
    it('should fetch patient details from /api/doctor/patients/:id', async () => {
      const patientId = signal<string | number | null>('42');
      const res = adapter.getPatientDetails(patientId);
      TestBed.tick();

      const req = httpTesting.expectOne('/api/doctor/patients/42');
      expect(req.request.method).toBe('GET');

      req.flush({
        id: '42',
        name: 'John Doe',
        ssn: '42',
        insurance: 'TestCo',
        appointments: [],
      });
      await vi.waitFor(() => {
        expect(res.value()).toEqual({
          id: '42',
          name: 'John Doe',
          ssn: '42',
          insurance: 'TestCo',
          appointments: [],
        });
      });
    });

    it('should not query when patientId is null', async () => {
      const patientId = signal<string | number | null>(null);
      const res = adapter.getPatientDetails(patientId);
      TestBed.tick();

      httpTesting.expectNone((r) => r.url.includes('/api/doctor/patients'));
      await vi.waitFor(() => {
        expect(res.value()).toBeNull();
      });
    });
  });

  describe('searchClerks', () => {
    it('should query /api/clerk/clerks/search and unwrap envelope', async () => {
      const q = signal('Alice');
      const res = adapter.searchClerks(q);
      TestBed.tick();

      const req = httpTesting.expectOne('/api/clerk/clerks/search?q=Alice');
      expect(req.request.method).toBe('GET');

      req.flush({
        clerks: [{ id: '9001', name: 'Alice Smith', ssn: '9001' }],
      });
      await vi.waitFor(() => {
        expect(res.value()).toEqual([{ id: '9001', name: 'Alice Smith', ssn: '9001' }]);
      });
    });
  });

  describe('getTimeSlots', () => {
    it('should format URL with date, doctorSsn and optional patientSsn', async () => {
      const params = signal<TimeSlotQueryParams | undefined>({
        date: '2026-10-15',
        doctorSsn: 'DOC123',
        patientSsn: 'PAT456',
      });
      const res = adapter.getTimeSlots(params);
      TestBed.tick();

      const req = httpTesting.expectOne(
        '/api/clerk/time-slots?date=2026-10-15&doctorSsn=DOC123&patientSsn=PAT456',
      );
      expect(req.request.method).toBe('GET');

      req.flush({
        date: '2026-10-15',
        doctorSsn: 'DOC123',
        patientSsn: 'PAT456',
        slots: [{ time: '09:00', available: true }],
        nextAvailableDate: null,
      });
      await vi.waitFor(() => {
        expect(res.value()?.slots).toHaveLength(1);
      });
    });

    it('should not query when parameters are incomplete', async () => {
      const params = signal<TimeSlotQueryParams | undefined>(undefined);
      const res = adapter.getTimeSlots(params);
      TestBed.tick();

      httpTesting.expectNone((r) => r.url.includes('/api/clerk/time-slots'));
      await vi.waitFor(() => {
        expect(res.value()).toBeUndefined();
      });
    });
  });

  describe('getMedications', () => {
    it('should query /api/doctor/medications and unwrap envelope', async () => {
      const res = adapter.getMedications();
      TestBed.tick();

      const req = httpTesting.expectOne('/api/doctor/medications');
      expect(req.request.method).toBe('GET');

      req.flush({
        medications: [
          { id: 1, name: 'Aspirin' },
          { id: 2, name: 'Paracetamol' },
        ],
      });
      await vi.waitFor(() => {
        expect(res.value()).toEqual([
          { id: 1, name: 'Aspirin' },
          { id: 2, name: 'Paracetamol' },
        ]);
      });
    });
  });

  describe('getDoctorEarningsReport', () => {
    it('should query /api/doctor/report with selected year', async () => {
      const year = signal(2026);
      const res = adapter.getDoctorEarningsReport(year);
      TestBed.tick();

      const req = httpTesting.expectOne('/api/doctor/report?year=2026');
      expect(req.request.method).toBe('GET');

      req.flush({
        year: 2026,
        data: [
          {
            id: 1,
            name: 'Dr. John',
            specialty: 'Surgery',
            department: 'Surgery',
            year: 2026,
            totalCosts: 5000,
          },
        ],
      });
      await vi.waitFor(() => {
        expect(res.value()?.data).toHaveLength(1);
        expect(res.value()?.year).toBe(2026);
      });
    });
  });

  describe('getPatientVisitsReport', () => {
    it('should query /api/clerk/reports/patient-visits with date range', async () => {
      const range = signal<DateRange | undefined>({
        startDate: '2026-01-01',
        endDate: '2026-06-30',
      });
      const res = adapter.getPatientVisitsReport(range);
      TestBed.tick();

      const req = httpTesting.expectOne(
        '/api/clerk/reports/patient-visits?startDate=2026-01-01&endDate=2026-06-30',
      );
      expect(req.request.method).toBe('GET');

      req.flush({
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        results: [],
      });
      await vi.waitFor(() => {
        expect(res.value()?.startDate).toBe('2026-01-01');
      });
    });
  });

  describe('bookAppointment', () => {
    const payload: CreateAppointmentRequest = {
      patientSsn: 'P1',
      doctorSsn: 'D1',
      date: '2026-10-20',
      time: '10:00',
      reason: 'Checkup',
    };

    it('should POST /api/clerk/appointments and return appointment response', async () => {
      const promise = adapter.bookAppointment(payload);

      const req = httpTesting.expectOne('/api/clerk/appointments');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);

      req.flush({
        success: true,
        appointmentId: 101,
        message: 'Booked',
      });

      const res = await promise;
      expect(res.success).toBe(true);
      expect(res.appointmentId).toBe(101);
    });

    it('should translate 409 Conflict response into BookingConflictError', async () => {
      const promise = adapter.bookAppointment(payload);

      const req = httpTesting.expectOne('/api/clerk/appointments');
      req.flush(
        { success: false, error: 'The selected time slot was already booked.' },
        { status: 409, statusText: 'Conflict' },
      );

      await expect(promise).rejects.toThrow(BookingConflictError);
    });

    it('should translate 500 error into HospitalDataError', async () => {
      const promise = adapter.bookAppointment(payload);

      const req = httpTesting.expectOne('/api/clerk/appointments');
      req.flush(
        { success: false, error: 'Internal DB failure' },
        { status: 500, statusText: 'Server Error' },
      );

      await expect(promise).rejects.toThrow(HospitalDataError);
    });
  });

  describe('addTreatment', () => {
    const treatment: Treatment = {
      description: 'Prescribed medication',
      cost: 150,
      medications: [{ id: 1, name: 'Aspirin' }],
    };

    it('should POST treatment to doctor endpoint', async () => {
      const promise = adapter.addTreatment('P1', 99, treatment);

      const req = httpTesting.expectOne('/api/doctor/patients/P1/appointments/99/treatments');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(treatment);

      req.flush({ success: true });

      const res = await promise;
      expect(res.success).toBe(true);
    });

    it('should translate network failure into HospitalDataError', async () => {
      const promise = adapter.addTreatment('P1', 99, treatment);

      const req = httpTesting.expectOne('/api/doctor/patients/P1/appointments/99/treatments');
      req.flush('Error', { status: 500, statusText: 'Internal Error' });

      await expect(promise).rejects.toThrow(HospitalDataError);
    });
  });

  describe('getDatabaseStatus', () => {
    it('should query /api/status and return DbStatus', async () => {
      const res = adapter.getDatabaseStatus();
      TestBed.tick();

      const req = httpTesting.expectOne('/api/status');
      expect(req.request.method).toBe('GET');

      req.flush({ dbType: 'MariaDB' });

      await vi.waitFor(() => {
        expect(res.value()).toEqual({ dbType: 'MariaDB' });
      });
    });
  });

  describe('seedDatabase', () => {
    it('should POST /api/admin/seed and return success response', async () => {
      const promise = adapter.seedDatabase();

      const req = httpTesting.expectOne('/api/admin/seed');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});

      req.flush({
        success: true,
        message: 'Database successfully populated with randomized test data.',
      });

      const res = await promise;
      expect(res.success).toBe(true);
      expect(res.message).toContain('Database successfully populated');
    });

    it('should translate seed network error into HospitalDataError', async () => {
      const promise = adapter.seedDatabase();

      const req = httpTesting.expectOne('/api/admin/seed');
      req.flush({ error: 'Seed failed' }, { status: 500, statusText: 'Server Error' });

      await expect(promise).rejects.toThrow(HospitalDataError);
    });
  });

  describe('migrateDatabase', () => {
    it('should POST /api/admin/migrate and return success response', async () => {
      const promise = adapter.migrateDatabase();

      const req = httpTesting.expectOne('/api/admin/migrate');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});

      req.flush({
        success: true,
        message:
          'Migration completed! MariaDB records successfully transferred and switched to MongoDB.',
      });

      const res = await promise;
      expect(res.success).toBe(true);
      expect(res.message).toContain('Migration completed');
    });

    it('should translate migrate network error into HospitalDataError', async () => {
      const promise = adapter.migrateDatabase();

      const req = httpTesting.expectOne('/api/admin/migrate');
      req.flush({ error: 'Migration failed' }, { status: 500, statusText: 'Server Error' });

      await expect(promise).rejects.toThrow(HospitalDataError);
    });
  });
});
