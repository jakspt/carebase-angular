import { TestBed } from '@angular/core/testing';
import { AppointmentIntakeWorkflow } from './appointment-intake-workflow';
import { AppointmentSubmissionCoordinator } from './appointment-submission-coordinator';
import { Clerk, Doctor, Patient } from '../models/models';
import {
  ActorSession,
  HOSPITAL_DATA_ACCESS,
  HospitalDataAccess,
  provideTestHospitalData,
  HeadlessSnackBar,
  OperationRunner,
  provideTestOperationRunner,
} from '../services';

describe('AppointmentIntakeWorkflow (Ticket 01)', () => {
  let workflow: AppointmentIntakeWorkflow;
  let actorSession: ActorSession;
  let dataAccess: HospitalDataAccess;
  let snackBar: HeadlessSnackBar;

  const mockClerk: Clerk = { id: '1001', name: 'Erika Mustermann', ssn: '1001' };
  const mockPatient: Patient = {
    id: '2002',
    name: 'Johann Schmidt',
    ssn: '2002',
    insurance: 'BVAEB',
    nacaScore: 2,
  };
  const mockCardioDoc: Doctor = {
    id: '3001',
    name: 'Dr. Alexander Weber',
    ssn: '3001',
    specialty: 'Cardiology',
    position: 'Chief of Department',
    department: 'Cardiology',
  };
  const mockNeuroDoc: Doctor = {
    id: '3002',
    name: 'Dr. Sarah Jenkins',
    ssn: '3002',
    specialty: 'Neurology',
    position: 'Attending',
    department: 'Neurology',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppointmentSubmissionCoordinator,
        AppointmentIntakeWorkflow,
        ActorSession,
        provideTestHospitalData(),
        provideTestOperationRunner(),
      ],
    });

    workflow = TestBed.inject(AppointmentIntakeWorkflow);
    actorSession = TestBed.inject(ActorSession);
    dataAccess = TestBed.inject(HOSPITAL_DATA_ACCESS);
    snackBar = TestBed.inject(HeadlessSnackBar);
    actorSession.setActiveClerk(mockClerk);
  });

  it('should be created and reflect active clerk from ActorSession', () => {
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
    expect(workflow.patientInputValue()).toBe('Johann Schmidt (SSN: 2002)');
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

    it('should reset selectedTimeSlot to null when selectedPatient changes via linkedSignal', () => {
      workflow.selectDoctor(mockCardioDoc);
      workflow.selectTimeSlot('09:00');
      expect(workflow.selectedTimeSlot()).toBe('09:00');

      // Change patient -> slot must reset to null declaratively
      workflow.selectPatient(mockPatient);
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

  describe('Submission & 409 Conflict Handling (Ticket 02)', () => {
    it('should return validation_error when required fields are missing', async () => {
      workflow.setReason('Routine checkup');
      const result = await workflow.submit();
      expect(result).toEqual({
        status: 'validation_error',
        message: 'Please fill in all required appointment details.',
      });
      expect(workflow.isSubmitting()).toBe(false);
      expect(workflow.bookingSuccess()).toBe(false);
    });

    it('should return validation_error and prevent submission if schema is invalid', async () => {
      workflow.selectPatient(mockPatient);
      workflow.selectDoctor(mockCardioDoc);
      workflow.selectDate(new Date(2026, 9, 20));
      workflow.selectTimeSlot('10:00');
      workflow.setReason('a'.repeat(501));

      const result = await workflow.submit();

      expect(result.status).toBe('validation_error');
      if (result.status === 'validation_error') {
        expect(result.message).toContain('500');
      }
      expect(workflow.bookingSuccess()).toBe(false);
      expect(workflow.createdAppointmentId()).toBeNull();
    });

    it('should transition to success state on successful submission', async () => {
      workflow.selectPatient(mockPatient);
      workflow.selectDoctor(mockCardioDoc);
      workflow.selectDate(new Date(2026, 9, 20));
      workflow.selectTimeSlot('10:00');
      workflow.setReason('Routine checkup');

      const result = await workflow.submit();

      expect(result.status).toBe('success');
      expect(workflow.bookingSuccess()).toBe(true);
      expect(workflow.createdAppointmentId()).toBeDefined();
      expect(workflow.isSubmitting()).toBe(false);
    });

    it('should handle conflict when slot is already booked: reset selectedTimeSlot, reload slots, and return conflict status', async () => {
      // Pre-book the slot in data store to induce genuine conflict
      await dataAccess.bookAppointment({
        patientSsn: '2001',
        doctorSsn: mockCardioDoc.ssn,
        date: '2026-10-20',
        time: '11:00',
        reason: 'Colliding appointment',
      });

      workflow.selectPatient(mockPatient);
      workflow.selectDoctor(mockCardioDoc);
      workflow.selectDate(new Date(2026, 9, 20));
      workflow.selectTimeSlot('11:00');

      const result = await workflow.submit();

      expect(result).toEqual({ status: 'conflict' });
      expect(workflow.selectedTimeSlot()).toBeNull();
      expect(workflow.bookingSuccess()).toBe(false);
      expect(workflow.isSubmitting()).toBe(false);
      expect(snackBar.lastMessage()).toBe(
        'Selected slot was just booked by another user. Please choose an alternate slot.',
      );

      // Verify slots were reloaded and slot is unavailable
      await vi.waitFor(() => {
        const slot = workflow.timeSlots().find((s) => s.time === '11:00');
        expect(slot?.available).toBe(false);
      });
    });

    it('should abort submission and return cancelled status if operation runner is locked', async () => {
      workflow.selectPatient(mockPatient);
      workflow.selectDoctor(mockCardioDoc);
      workflow.selectDate(new Date(2026, 9, 20));
      workflow.selectTimeSlot('10:00');
      workflow.setReason('Routine checkup');

      const operationRunner = TestBed.inject(OperationRunner);
      let finishLockedOp!: () => void;
      const lockedPromise = new Promise<void>((resolve) => {
        finishLockedOp = resolve;
      });
      const ongoingOp = operationRunner.execute(() => lockedPromise);

      try {
        expect(workflow.isLocked()).toBe(true);
        expect(workflow.isSubmitting()).toBe(true);

        const result = await workflow.submit();
        expect(result).toEqual({
          status: 'error',
          message: 'An operation is already in progress.',
        });
        expect(workflow.appointmentSuccess()).toBe(false);
        expect(workflow.createdAppointmentId()).toBeNull();
      } finally {
        finishLockedOp();
        await ongoingOp;
      }

      expect(workflow.isLocked()).toBe(false);
      expect(workflow.isSubmitting()).toBe(false);
    });

    it('should handle general error and return error status with message', async () => {
      const originalBook = dataAccess.bookAppointment;
      dataAccess.bookAppointment = async () => {
        throw new Error('Database connection failed');
      };

      try {
        workflow.selectPatient(mockPatient);
        workflow.selectDoctor(mockCardioDoc);
        workflow.selectDate(new Date(2026, 9, 20));
        workflow.selectTimeSlot('12:00');

        const result = await workflow.submit();

        expect(result).toEqual({ status: 'error', message: 'Database connection failed' });
        expect(workflow.bookingSuccess()).toBe(false);
        expect(workflow.isSubmitting()).toBe(false);
      } finally {
        dataAccess.bookAppointment = originalBook;
      }
    });
  });

  describe('Signal Forms in Review Step (Ticket 03)', () => {
    it('should initialize bookingModel and bookingForm with empty reason', () => {
      expect(workflow.bookingModel().reason).toBe('');
      expect(workflow.bookingForm.reason().value()).toBe('');
      expect(workflow.bookingForm().valid()).toBe(true);
    });

    it('should update reason when bookingModel changes', () => {
      workflow.bookingModel.set({ reason: 'Follow-up consultation' });
      expect(workflow.reason()).toBe('Follow-up consultation');
    });

    it('should validate reason length schema (max 500 chars)', () => {
      const longText = 'a'.repeat(501);
      workflow.bookingModel.set({ reason: longText });
      expect(workflow.bookingForm().invalid()).toBe(true);
      expect(workflow.bookingForm.reason().errors().length).toBeGreaterThan(0);

      workflow.bookingModel.set({ reason: 'Valid short reason' });
      expect(workflow.bookingForm().valid()).toBe(true);
    });

    it('should reset bookingModel on workflow reset', () => {
      workflow.bookingModel.set({ reason: 'Some notes' });
      workflow.reset();
      expect(workflow.bookingModel().reason).toBe('');
      expect(workflow.reason()).toBe('');
    });
  });
});
