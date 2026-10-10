import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ClerkService } from './clerk-service';
import { Clerk, CreateAppointmentRequest } from '../models/models';
import { HOSPITAL_DATA_ACCESS } from './hospital-data-access';
import { InMemoryHospitalDataAdapter } from './in-memory-hospital-data-adapter';

describe('ClerkService', () => {
  let service: ClerkService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ClerkService,
        { provide: HOSPITAL_DATA_ACCESS, useClass: InMemoryHospitalDataAdapter },
      ],
    });
    service = TestBed.inject(ClerkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should manage active clerk session state with persistence across rehydration', () => {
    sessionStorage.clear();
    expect(service.getActiveClerk()()).toBeNull();
    const clerk: Clerk = { id: '1001', name: 'Erika Mustermann', ssn: '1001' };
    service.setActiveClerk(clerk);
    expect(service.getActiveClerk()()).toEqual(clerk);

    // Verify recovery on rehydration
    const freshClerkService = TestBed.inject(ClerkService);
    expect(freshClerkService.getActiveClerk()()).toEqual(clerk);

    service.setActiveClerk(null);
    expect(service.getActiveClerk()()).toBeNull();
    expect(freshClerkService.getActiveClerk()()).toBeNull();
  });

  it('should book an appointment via delegated bookAppointment', async () => {
    const request: CreateAppointmentRequest = {
      patientSsn: '2001',
      doctorSsn: '3001',
      date: '2026-11-20',
      time: '14:00',
      reason: 'Checkup',
      clerkSsn: '1001',
    };

    const res = await firstValueFrom(service.bookAppointment(request));
    expect(res.success).toBe(true);
    expect(res.appointmentId).toBeDefined();
  });

  it('should initialize resource query handlers', () => {
    const clerksRes = service.searchClerks(() => 'test');
    expect(clerksRes).toBeTruthy();

    const patientsRes = service.searchPatients(() => 'Maria');
    expect(patientsRes).toBeTruthy();

    const doctorsRes = service.getDoctors();
    expect(doctorsRes).toBeTruthy();

    const slotsRes = service.getTimeSlots(() => ({ date: '2026-10-15', doctorSsn: '3001' }));
    expect(slotsRes).toBeTruthy();

    const reportRes = service.getPatientVisitsReport(() => ({
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    }));
    expect(reportRes).toBeTruthy();
  });
});
