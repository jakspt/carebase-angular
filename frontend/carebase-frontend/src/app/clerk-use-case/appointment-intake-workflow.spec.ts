import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AppointmentIntakeWorkflow } from './appointment-intake-workflow';
import { ClerkService } from '../services/clerk-service';
import { Clerk, Doctor, Patient, TimeSlot } from '../models/models';

describe('AppointmentIntakeWorkflow (Ticket 01)', () => {
  let workflow: AppointmentIntakeWorkflow;
  let clerkService: ClerkService;
  let httpTesting: HttpTestingController;

  const mockClerk: Clerk = { id: '1001', name: 'Erika Mustermann', ssn: '1001' };
  const mockPatient: Patient = {
    id: '2041',
    name: 'Johann Schmidt',
    ssn: '2041',
    insurance: 'ÖGK',
    nacaScore: 2,
  };
  const mockCardioDoc: Doctor = {
    id: '3011',
    name: 'Dr. Sarah Connor',
    ssn: '3011',
    specialty: 'Cardiology',
    position: 'Chief Physician',
    department: 'Cardiology',
  };
  const mockNeuroDoc: Doctor = {
    id: '3012',
    name: 'Dr. John Smith',
    ssn: '3012',
    specialty: 'Neurology',
    position: 'Specialist',
    department: 'Neurology',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppointmentIntakeWorkflow,
        ClerkService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    workflow = TestBed.inject(AppointmentIntakeWorkflow);
    clerkService = TestBed.inject(ClerkService);
    httpTesting = TestBed.inject(HttpTestingController);
    clerkService.setActiveClerk(mockClerk);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created and reflect active clerk from ClerkService', () => {
    expect(workflow).toBeTruthy();
    expect(workflow.activeClerk()).toEqual(mockClerk);
  });

  it('should initialize with default states and minDate set to midnight today', () => {
    expect(workflow.selectedPatient()).toBeNull();
    expect(workflow.selectedDepartment()).toBe('');
    expect(workflow.selectedDoctor()).toBeNull();
    expect(workflow.selectedTimeSlot()).toBeNull();
    expect(workflow.minDate.getHours()).toBe(0);
    expect(workflow.minDate.getMinutes()).toBe(0);
    expect(workflow.minDate.getSeconds()).toBe(0);
    expect(workflow.minDate.getMilliseconds()).toBe(0);
    expect(workflow.selectedDate()).toEqual(workflow.minDate);
  });

  it('should handle patient input debounce', () => {
    vi.useFakeTimers();
    try {
      workflow.setPatientSearchInput('Johann');
      expect(workflow.patientInputValue()).toBe('Johann');
      expect(workflow.patientSearchQuery()).toBe('');

      vi.advanceTimersByTime(300);
      expect(workflow.patientSearchQuery()).toBe('Johann');
    } finally {
      vi.useRealTimers();
    }
  });

  it('should set selected patient and reset selected time slot', () => {
    workflow.selectTimeSlot('09:00');
    expect(workflow.selectedTimeSlot()).toBe('09:00');

    workflow.selectPatient(mockPatient);
    expect(workflow.selectedPatient()).toEqual(mockPatient);
    expect(workflow.patientInputValue()).toBe('Johann Schmidt (SSN: 2041)');
    expect(workflow.patientSearchQuery()).toBe('Johann Schmidt');
    expect(workflow.selectedTimeSlot()).toBeNull();
  });

  it('should format selected date to YYYY-MM-DD', () => {
    workflow.selectDate(new Date(2026, 9, 15));
    expect(workflow.formattedDate()).toBe('2026-10-15');

    workflow.selectDate(null);
    expect(workflow.formattedDate()).toBe('');
  });

  it('should toggle time slot selection on click', () => {
    workflow.selectTimeSlot('10:00');
    expect(workflow.selectedTimeSlot()).toBe('10:00');

    // Toggling the same slot clears it
    workflow.selectTimeSlot('10:00');
    expect(workflow.selectedTimeSlot()).toBeNull();

    // Selecting a different slot sets it
    workflow.selectTimeSlot('10:30');
    expect(workflow.selectedTimeSlot()).toBe('10:30');
  });

  describe('Declarative dependent state with linkedSignal', () => {
    it('should reset selectedDoctor to null when selectedDepartment changes to an incompatible department', () => {
      workflow.selectDoctor(mockCardioDoc);
      expect(workflow.selectedDoctor()).toEqual(mockCardioDoc);

      // Switching to Cardiology keeps the doctor
      workflow.selectDepartment('Cardiology');
      expect(workflow.selectedDoctor()).toEqual(mockCardioDoc);

      // Switching to all departments keeps the doctor
      workflow.selectDepartment('');
      expect(workflow.selectedDoctor()).toEqual(mockCardioDoc);

      // Switching to Neurology automatically resets selectedDoctor to null via linkedSignal
      workflow.selectDepartment('Neurology');
      expect(workflow.selectedDoctor()).toBeNull();
    });

    it('should reset selectedTimeSlot to null when selectedDoctor changes via linkedSignal', () => {
      workflow.selectDoctor(mockCardioDoc);
      workflow.selectTimeSlot('09:00');
      expect(workflow.selectedTimeSlot()).toBe('09:00');

      // Change doctor -> slot must reset to null
      workflow.selectDoctor(mockNeuroDoc);
      expect(workflow.selectedTimeSlot()).toBeNull();
    });

    it('should reset selectedTimeSlot to null when selectedDate changes via linkedSignal', () => {
      workflow.selectDoctor(mockCardioDoc);
      workflow.selectDate(new Date(2026, 9, 15));
      workflow.selectTimeSlot('09:00');
      expect(workflow.selectedTimeSlot()).toBe('09:00');

      // Change date -> slot must reset to null
      workflow.selectDate(new Date(2026, 9, 16));
      expect(workflow.selectedTimeSlot()).toBeNull();
    });
  });

  it('should update selected date via selectNextAvailableDate', () => {
    workflow.selectNextAvailableDate('2026-11-05');
    expect(workflow.formattedDate()).toBe('2026-11-05');
    expect(workflow.selectedDate()?.getHours()).toBe(0);

    const testDate = new Date(2026, 11, 25);
    workflow.selectNextAvailableDate(testDate);
    expect(workflow.formattedDate()).toBe('2026-12-25');
  });

  it('should reset workflow state cleanly while preserving active clerk', () => {
    workflow.selectPatient(mockPatient);
    workflow.selectDoctor(mockCardioDoc);
    workflow.selectDepartment('Cardiology');
    workflow.selectDate(new Date(2026, 9, 20));
    workflow.selectTimeSlot('11:00');

    workflow.reset();

    expect(workflow.selectedPatient()).toBeNull();
    expect(workflow.selectedDepartment()).toBe('');
    expect(workflow.selectedDoctor()).toBeNull();
    expect(workflow.selectedTimeSlot()).toBeNull();
    expect(workflow.patientInputValue()).toBe('');
    expect(workflow.patientSearchQuery()).toBe('');
    expect(workflow.selectedDate()).toEqual(workflow.minDate);
    expect(workflow.activeClerk()).toEqual(mockClerk);
  });
});
