import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ClerkService } from './clerk-service';
import { Clerk, CreateAppointmentRequest } from '../models/models';

describe('ClerkService', () => {
  let service: ClerkService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClerkService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClerkService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should manage active clerk session state with sessionStorage persistence', () => {
    sessionStorage.clear();
    expect(service.getActiveClerk()()).toBeNull();
    const clerk: Clerk = { id: '1001', name: 'Erika Mustermann', ssn: '1001' };
    service.setActiveClerk(clerk);
    expect(service.getActiveClerk()()).toEqual(clerk);
    const stored = JSON.parse(sessionStorage.getItem('carebase_actor_session')!);
    expect(stored.activeClerk).toEqual(clerk);

    service.setActiveClerk(null);
    expect(service.getActiveClerk()()).toBeNull();
    const storedAfter = JSON.parse(sessionStorage.getItem('carebase_actor_session')!);
    expect(storedAfter.activeClerk).toBeNull();
  });

  it('should book an appointment via POST /api/clerk/appointments', () => {
    const request: CreateAppointmentRequest = {
      patientSsn: '2041',
      doctorSsn: '3011',
      date: '2026-10-15',
      time: '09:00',
      reason: 'Checkup',
      clerkSsn: '1001',
    };

    service.bookAppointment(request).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.appointmentId).toBe(42);
    });

    const req = httpTesting.expectOne('/api/clerk/appointments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({
      success: true,
      appointmentId: 42,
      message: 'Appointment successfully scheduled',
    });
  });

  it('should initialize resource query handlers', () => {
    const clerksRes = service.searchClerks(() => 'test');
    expect(clerksRes).toBeTruthy();

    const patientsRes = service.searchPatients(() => 'Maria');
    expect(patientsRes).toBeTruthy();

    const doctorsRes = service.getDoctors();
    expect(doctorsRes).toBeTruthy();

    const slotsRes = service.getTimeSlots(() => ({ date: '2026-10-15', doctorSsn: '3011' }));
    expect(slotsRes).toBeTruthy();

    const reportRes = service.getPatientVisitsReport(() => ({
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    }));
    expect(reportRes).toBeTruthy();
  });
});
