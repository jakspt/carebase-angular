import { inject, Injectable } from '@angular/core';
import {
  AppointmentResult,
  Clerk,
  CreateAppointmentRequest,
  Doctor,
  Patient,
} from '../models/models';
import {
  AppointmentConflictError,
  OperationRunner,
  SCHEDULING_DATA_ACCESS,
} from '../services';

export interface AppointmentSubmissionOptions {
  patient: Patient | null;
  doctor: Doctor | null;
  clerk: Clerk | null;
  date: string;
  timeSlot: string | null;
  reason?: string;
  onConflict?: () => void | Promise<void>;
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentSubmissionCoordinator {
  private readonly schedulingDataAccess = inject(SCHEDULING_DATA_ACCESS);
  private readonly operationRunner = inject(OperationRunner);

  async submitAppointment(options: AppointmentSubmissionOptions): Promise<AppointmentResult> {
    if (!options.patient || !options.doctor || !options.date || !options.timeSlot) {
      return {
        status: 'validation_error',
        message: 'Please fill in all required appointment details.',
      };
    }

    if (options.reason && options.reason.length > 500) {
      return {
        status: 'validation_error',
        message: 'Reason cannot exceed 500 characters.',
      };
    }

    const payload: CreateAppointmentRequest = {
      patientSsn: String(options.patient.ssn),
      doctorSsn: String(options.doctor.ssn),
      date: options.date,
      time: options.timeSlot,
      reason: options.reason ? options.reason.trim() : '',
      clerkSsn: options.clerk ? String(options.clerk.ssn) : undefined,
    };

    const runnerResult = await this.operationRunner.execute(
      async () => {
        const scheduling = this.schedulingDataAccess;
        const response =
          typeof scheduling.createAppointment === 'function'
            ? await scheduling.createAppointment(payload)
            : await scheduling.bookAppointment(payload);

        if (response && (response as any).success === false) {
          throw new Error(
            (response as any).message || (response as any).error || 'Failed to schedule appointment.',
          );
        }
        if (
          response &&
          ((response as any).status === 'error' || (response as any).status === 'validation_error')
        ) {
          throw new Error((response as any).message || 'Failed to schedule appointment.');
        }
        if (response && (response as any).status === 'conflict') {
          throw new AppointmentConflictError(
            (response as any).message || 'Appointment scheduling conflict.',
          );
        }
        return response;
      },
      {
        successMessage: 'Appointment successfully scheduled.',
        errorMessageResolver: (err: unknown) => {
          if (this.isConflictError(err)) {
            return 'Selected slot was just booked by another user. Please choose an alternate slot.';
          }
          return err instanceof Error
            ? err.message
            : (err as any)?.error?.error ||
                'Failed to schedule appointment. Please check your data and retry.';
        },
      },
    );

    if (runnerResult.status === 'success' && runnerResult.data) {
      const data = runnerResult.data as any;
      const appointmentId = data.appointmentId ?? data.id ?? data.appointment?.id;
      return {
        status: 'success',
        appointmentId,
      };
    }

    if (this.isConflictError(runnerResult.error)) {
      if (options.onConflict) {
        try {
          await options.onConflict();
        } catch {
          // Ignore async error from onConflict callback
        }
      }
      return { status: 'conflict' };
    }

    if (runnerResult.status === 'cancelled') {
      return { status: 'error', message: 'An operation is already in progress.' };
    }

    const errorMsg =
      runnerResult.error instanceof Error
        ? runnerResult.error.message
        : (runnerResult.error as any)?.error?.error ||
          'Failed to schedule appointment. Please check your data and retry.';
    return { status: 'error', message: errorMsg };
  }

  readonly submit = (options: AppointmentSubmissionOptions): Promise<AppointmentResult> =>
    this.submitAppointment(options);

  private isConflictError(err: unknown): boolean {
    if (!err) return false;
    if (err instanceof AppointmentConflictError) {
      return true;
    }
    const anyErr = err as Record<string, any>;
    if (anyErr['status'] === 409 || anyErr['statusCode'] === 409) {
      return true;
    }
    if (anyErr['name'] === 'AppointmentConflictError') {
      return true;
    }
    if (anyErr['error'] && typeof anyErr['error'] === 'object' && anyErr['error']['status'] === 409) {
      return true;
    }
    return false;
  }
}
