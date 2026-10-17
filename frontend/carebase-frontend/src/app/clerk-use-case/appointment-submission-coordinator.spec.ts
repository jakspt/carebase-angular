import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppointmentSubmissionCoordinator, AppointmentSubmissionOptions } from './appointment-submission-coordinator';
import { Clerk, CreateAppointmentRequest, CreateAppointmentResponse, Doctor, Patient } from '../models/models';
import {
  AppointmentConflictError,
  BookingConflictError,
  HeadlessSnackBar,
  OperationRunner,
  provideTestOperationRunner,
  SCHEDULING_DATA_ACCESS,
  SchedulingDataAccess,
} from '../services';

describe('AppointmentSubmissionCoordinator', () => {
  let coordinator: AppointmentSubmissionCoordinator;
  let mockSchedulingDataAccess: Partial<SchedulingDataAccess>;
  let lastBookedRequest: CreateAppointmentRequest | undefined;
  let lastCreatedRequest: CreateAppointmentRequest | undefined;
  let snackBar: HeadlessSnackBar;
  let operationRunner: OperationRunner;

  const mockClerk: Clerk = { id: '1001', name: 'Erika Mustermann', ssn: '1001' };
  const mockPatient: Patient = {
    id: '2002',
    name: 'Johann Schmidt',
    ssn: '2002',
    insurance: 'BVAEB',
    nacaScore: 2,
  };
  const mockDoctor: Doctor = {
    id: '3001',
    name: 'Dr. Alexander Weber',
    ssn: '3001',
    specialty: 'Cardiology',
    position: 'Chief of Department',
    department: 'Cardiology',
  };

  const defaultOptions: AppointmentSubmissionOptions = {
    patient: mockPatient,
    doctor: mockDoctor,
    clerk: mockClerk,
    date: '2026-10-25',
    timeSlot: '09:30',
    reason: 'Regular cardiology followup',
  };

  beforeEach(() => {
    lastBookedRequest = undefined;
    lastCreatedRequest = undefined;

    mockSchedulingDataAccess = {
      bookAppointment: async (req: CreateAppointmentRequest) => {
        lastBookedRequest = req;
        return {
          success: true,
          appointmentId: 101,
        } as CreateAppointmentResponse;
      },
    };

    TestBed.configureTestingModule({
      providers: [
        AppointmentSubmissionCoordinator,
        provideTestOperationRunner(),
        {
          provide: SCHEDULING_DATA_ACCESS,
          useValue: mockSchedulingDataAccess,
        },
      ],
    });

    coordinator = TestBed.inject(AppointmentSubmissionCoordinator);
    snackBar = TestBed.inject(HeadlessSnackBar);
    operationRunner = TestBed.inject(OperationRunner);
  });

  it('should be created and injectable', () => {
    expect(coordinator).toBeTruthy();
  });

  describe('Missing parameters and validation', () => {
    it('should fail validation when patient is missing', async () => {
      const result = await coordinator.submitAppointment({
        ...defaultOptions,
        patient: null,
      });

      expect(result).toEqual({
        status: 'validation_error',
        message: 'Please fill in all required appointment details.',
      });
      expect(lastBookedRequest).toBeUndefined();
    });

    it('should fail validation when doctor is missing', async () => {
      const result = await coordinator.submitAppointment({
        ...defaultOptions,
        doctor: null,
      });

      expect(result).toEqual({
        status: 'validation_error',
        message: 'Please fill in all required appointment details.',
      });
      expect(lastBookedRequest).toBeUndefined();
    });

    it('should fail validation when date is empty', async () => {
      const result = await coordinator.submitAppointment({
        ...defaultOptions,
        date: '',
      });

      expect(result).toEqual({
        status: 'validation_error',
        message: 'Please fill in all required appointment details.',
      });
      expect(lastBookedRequest).toBeUndefined();
    });

    it('should fail validation when time slot is null', async () => {
      const result = await coordinator.submitAppointment({
        ...defaultOptions,
        timeSlot: null,
      });

      expect(result).toEqual({
        status: 'validation_error',
        message: 'Please fill in all required appointment details.',
      });
      expect(lastBookedRequest).toBeUndefined();
    });

    it('should fail validation when reason exceeds 500 characters', async () => {
      const result = await coordinator.submitAppointment({
        ...defaultOptions,
        reason: 'x'.repeat(501),
      });

      expect(result).toEqual({
        status: 'validation_error',
        message: 'Reason cannot exceed 500 characters.',
      });
      expect(lastBookedRequest).toBeUndefined();
    });
  });

  describe('Successful submission', () => {
    it('should successfully submit appointment via bookAppointment and return appointmentId', async () => {
      const result = await coordinator.submitAppointment(defaultOptions);

      expect(result).toEqual({
        status: 'success',
        appointmentId: 101,
      });
      expect(lastBookedRequest).toEqual({
        patientSsn: '2002',
        doctorSsn: '3001',
        date: '2026-10-25',
        time: '09:30',
        reason: 'Regular cardiology followup',
        clerkSsn: '1001',
      });
      expect(snackBar.lastMessage()).toBe('Appointment successfully scheduled.');
    });

    it('should support submit() as well as submitAppointment()', async () => {
      const result = await coordinator.submit(defaultOptions);

      expect(result).toEqual({
        status: 'success',
        appointmentId: 101,
      });
      expect(lastBookedRequest?.patientSsn).toBe('2002');
    });

    it('should handle missing clerk by passing undefined clerkSsn', async () => {
      const result = await coordinator.submitAppointment({
        ...defaultOptions,
        clerk: null,
      });

      expect(result).toEqual({
        status: 'success',
        appointmentId: 101,
      });
      expect(lastBookedRequest?.clerkSsn).toBeUndefined();
    });

    it('should use createAppointment when provided by SchedulingDataAccess', async () => {
      mockSchedulingDataAccess.createAppointment = async (req: CreateAppointmentRequest) => {
        lastCreatedRequest = req;
        return {
          status: 'success',
          appointmentId: 202,
        };
      };

      const result = await coordinator.submitAppointment(defaultOptions);

      expect(result).toEqual({
        status: 'success',
        appointmentId: 202,
      });
      expect(lastCreatedRequest).toEqual({
        patientSsn: '2002',
        doctorSsn: '3001',
        date: '2026-10-25',
        time: '09:30',
        reason: 'Regular cardiology followup',
        clerkSsn: '1001',
      });
      expect(lastBookedRequest).toBeUndefined();
    });
  });

  describe('Conflict detection and handling', () => {
    it('should detect AppointmentConflictError, call onConflict, resolve snackbar message, and return conflict status', async () => {
      let conflictCallbackInvoked = false;
      mockSchedulingDataAccess.bookAppointment = async () => {
        throw new AppointmentConflictError('Slot unavailable');
      };

      const result = await coordinator.submitAppointment({
        ...defaultOptions,
        onConflict: () => {
          conflictCallbackInvoked = true;
        },
      });

      expect(result).toEqual({ status: 'conflict' });
      expect(conflictCallbackInvoked).toBe(true);
      expect(snackBar.lastMessage()).toBe(
        'Selected slot was just booked by another user. Please choose an alternate slot.',
      );
    });

    it('should detect BookingConflictError backward-compatible alias and call onConflict', async () => {
      let conflictCallbackInvoked = false;
      mockSchedulingDataAccess.bookAppointment = async () => {
        throw new BookingConflictError('Slot unavailable');
      };

      const result = await coordinator.submitAppointment({
        ...defaultOptions,
        onConflict: () => {
          conflictCallbackInvoked = true;
        },
      });

      expect(result).toEqual({ status: 'conflict' });
      expect(conflictCallbackInvoked).toBe(true);
      expect(snackBar.lastMessage()).toBe(
        'Selected slot was just booked by another user. Please choose an alternate slot.',
      );
    });

    it('should detect HTTP 409 conflict error status and invoke onConflict', async () => {
      let conflictCallbackInvoked = false;
      const http409Error = { status: 409, message: 'Slot already taken' };
      mockSchedulingDataAccess.bookAppointment = async () => {
        throw http409Error;
      };

      const result = await coordinator.submitAppointment({
        ...defaultOptions,
        onConflict: () => {
          conflictCallbackInvoked = true;
        },
      });

      expect(result).toEqual({ status: 'conflict' });
      expect(conflictCallbackInvoked).toBe(true);
      expect(snackBar.lastMessage()).toBe(
        'Selected slot was just booked by another user. Please choose an alternate slot.',
      );
    });

    it('should await asynchronous onConflict callback when conflict occurs', async () => {
      let asyncCallbackFinished = false;
      const asyncOnConflict = async () => {
        await Promise.resolve();
        asyncCallbackFinished = true;
      };

      mockSchedulingDataAccess.bookAppointment = async () => {
        throw new AppointmentConflictError('Slot collision');
      };

      const result = await coordinator.submitAppointment({
        ...defaultOptions,
        onConflict: asyncOnConflict,
      });

      expect(result).toEqual({ status: 'conflict' });
      expect(asyncCallbackFinished).toBe(true);
    });
  });

  describe('Generic failure handling', () => {
    it('should handle general Error rejection and return error status with message', async () => {
      mockSchedulingDataAccess.bookAppointment = async () => {
        throw new Error('Network connection dropped');
      };

      const result = await coordinator.submitAppointment(defaultOptions);

      expect(result).toEqual({
        status: 'error',
        message: 'Network connection dropped',
      });
      expect(snackBar.lastMessage()).toBe('Network connection dropped');
    });

    it('should handle structured error payload with nested error message', async () => {
      mockSchedulingDataAccess.bookAppointment = async () => {
        throw {
          error: { error: 'Database constraint violated' },
        };
      };

      const result = await coordinator.submitAppointment(defaultOptions);

      expect(result).toEqual({
        status: 'error',
        message: 'Database constraint violated',
      });
      expect(snackBar.lastMessage()).toBe('Database constraint violated');
    });

    it('should return error when response has success: false', async () => {
      mockSchedulingDataAccess.bookAppointment = async () => ({
        success: false,
        message: 'Doctor schedule is currently blocked.',
      });

      const result = await coordinator.submitAppointment(defaultOptions);

      expect(result).toEqual({
        status: 'error',
        message: 'Doctor schedule is currently blocked.',
      });
      expect(snackBar.lastMessage()).toBe('Doctor schedule is currently blocked.');
    });

    it('should return error status when OperationRunner is locked', async () => {
      let finishLockedOp!: () => void;
      const lockedPromise = new Promise<void>((resolve) => {
        finishLockedOp = resolve;
      });
      const ongoingOp = operationRunner.execute(() => lockedPromise);

      try {
        expect(operationRunner.isLocked()).toBe(true);

        const result = await coordinator.submitAppointment(defaultOptions);

        expect(result).toEqual({
          status: 'error',
          message: 'An operation is already in progress.',
        });
        expect(lastBookedRequest).toBeUndefined();
      } finally {
        finishLockedOp();
        await ongoingOp;
      }
    });
  });
});
