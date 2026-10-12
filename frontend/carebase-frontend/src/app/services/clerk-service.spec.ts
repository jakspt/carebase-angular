import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ClerkService } from './clerk-service';
import { ActorSession } from './actor-session';
import { Clerk, CreateAppointmentRequest } from '../models/models';
import { TimeSlotQueryParams } from './hospital-data-access';
import { provideTestHospitalData } from './in-memory-hospital-data-adapter';

describe('ClerkService', () => {
  let service: ClerkService;

  const mockClerk: Clerk = { id: '1001', name: 'Erika Mustermann', ssn: '1001' };

  function createHydratedClerkService(): ClerkService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ClerkService, ActorSession, provideTestHospitalData()],
    });
    return TestBed.inject(ClerkService);
  }

  beforeEach(() => {
    sessionStorage.clear();
    service = createHydratedClerkService();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Session Rehydration & Persistence', () => {
    it('should initialize with null active clerk when session storage is empty', () => {
      expect(service.getActiveClerk()()).toBeNull();
    });

    it('should persist active clerk and rehydrate state in a fresh injector context', () => {
      service.setActiveClerk(mockClerk);
      expect(service.getActiveClerk()()).toEqual(mockClerk);

      // Verify fresh state hydration by resetting injector context
      const freshService = createHydratedClerkService();
      expect(freshService.getActiveClerk()()).toEqual(mockClerk);

      // Clear clerk and verify across fresh injector rehydration
      freshService.setActiveClerk(null);
      expect(freshService.getActiveClerk()()).toBeNull();

      const clearedService = createHydratedClerkService();
      expect(clearedService.getActiveClerk()()).toBeNull();
    });

    it('should hydrate active clerk from pre-existing storage state on service instantiation', () => {
      sessionStorage.setItem(
        'carebase_actor_session',
        JSON.stringify({
          role: 'clerk',
          activeClerk: mockClerk,
          activeDoctor: null,
        }),
      );

      const rehydratedService = createHydratedClerkService();
      expect(rehydratedService.getActiveClerk()()).toEqual(mockClerk);
    });
  });

  describe('Appointment Booking Delegation', () => {
    it('should book an appointment via delegated bookAppointment and reserve slot in data store', async () => {
      const request: CreateAppointmentRequest = {
        patientSsn: '2001',
        doctorSsn: '3001',
        date: '2026-11-20',
        time: '14:00',
        reason: 'Routine checkup',
        clerkSsn: '1001',
      };

      const res = await firstValueFrom(service.bookAppointment(request));
      expect(res.success).toBe(true);
      expect(res.appointmentId).toBeDefined();

      // Verify chosen slot is reflected as unavailable in the underlying hospital data store
      const slotsRef = service.getTimeSlots(() => ({
        date: '2026-11-20',
        doctorSsn: '3001',
      }));
      await vi.waitFor(() => {
        expect(slotsRef.value()).toBeDefined();
      });

      const slot = slotsRef.value()?.slots.find((s) => s.time === '14:00');
      expect(slot?.available).toBe(false);
    });
  });

  describe('Reactive Resource Emissions', () => {
    it('should emit matching clerk records when searching clerks', async () => {
      const q = signal('Erika');
      const clerksRes = service.searchClerks(() => q());

      await vi.waitFor(() => {
        expect(clerksRes.value().length).toBeGreaterThan(0);
      });

      const clerks = clerksRes.value();
      expect(clerks[0].name).toContain('Erika');
      expect(clerks[0].ssn).toBe('1001');
    });

    it('should emit matching patient records when searching patients', async () => {
      const q = signal('Maria');
      const patientsRes = service.searchPatients(() => q());

      await vi.waitFor(() => {
        expect(patientsRes.value().length).toBeGreaterThan(0);
      });

      const patients = patientsRes.value();
      expect(patients[0].name).toContain('Maria');
      expect(patients[0].ssn).toBe('2001');
    });

    it('should emit hospital doctors with specialties and departments', async () => {
      const doctorsRes = service.getDoctors();

      await vi.waitFor(() => {
        expect(doctorsRes.value().length).toBeGreaterThan(0);
      });

      const doctors = doctorsRes.value();
      expect(doctors.some((d) => d.name === 'Dr. Alexander Weber')).toBe(true);
      expect(doctors[0]).toHaveProperty('specialty');
      expect(doctors[0]).toHaveProperty('department');
    });

    it('should emit operational time slots for a designated doctor and date', async () => {
      const params = signal<TimeSlotQueryParams | undefined>({
        date: '2026-10-15',
        doctorSsn: '3001',
      });
      const slotsRes = service.getTimeSlots(() => params());

      await vi.waitFor(() => {
        expect(slotsRes.value()).toBeDefined();
      });

      const slotData = slotsRes.value();
      expect(slotData?.slots.length).toBeGreaterThan(0);
      expect(slotData?.slots[0].time).toBe('08:00');
    });

    it('should emit Consultation Frequency Report results within date range', async () => {
      const dateRange = signal<{ startDate: string; endDate: string } | undefined>({
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      });
      const reportRes = service.getPatientVisitsReport(() => dateRange());

      await vi.waitFor(() => {
        expect(reportRes.value()).toBeDefined();
      });

      const report = reportRes.value();
      expect(report?.startDate).toBe('2026-01-01');
      expect(report?.endDate).toBe('2026-12-31');
      expect(Array.isArray(report?.results)).toBe(true);
    });
  });
});
