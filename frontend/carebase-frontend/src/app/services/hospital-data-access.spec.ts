import { InjectionToken } from '@angular/core';
import {
  HOSPITAL_DATA_ACCESS,
  HospitalDataAccess,
  HospitalDataError,
  BookingConflictError,
  PatientNotFoundError,
} from './hospital-data-access';

describe('HospitalDataAccess Port and Domain Errors', () => {
  it('should export HOSPITAL_DATA_ACCESS as an InjectionToken', () => {
    expect(HOSPITAL_DATA_ACCESS).toBeInstanceOf(InjectionToken);
    expect(HOSPITAL_DATA_ACCESS.toString()).toContain('HOSPITAL_DATA_ACCESS');
  });

  describe('Domain Error Hierarchy', () => {
    it('HospitalDataError should be an instance of Error', () => {
      const err = new HospitalDataError('Network failed', { status: 500 });
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(HospitalDataError);
      expect(err.name).toBe('HospitalDataError');
      expect(err.message).toBe('Network failed');
      expect(err.cause).toEqual({ status: 500 });
    });

    it('BookingConflictError should extend HospitalDataError', () => {
      const err = new BookingConflictError();
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(HospitalDataError);
      expect(err).toBeInstanceOf(BookingConflictError);
      expect(err.name).toBe('BookingConflictError');
      expect(err.message).toBe('Appointment time slot is no longer available.');
    });

    it('BookingConflictError should support custom message and cause', () => {
      const err = new BookingConflictError('Slot taken', { status: 409 });
      expect(err.message).toBe('Slot taken');
      expect(err.cause).toEqual({ status: 409 });
    });

    it('PatientNotFoundError should extend HospitalDataError', () => {
      const err = new PatientNotFoundError();
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(HospitalDataError);
      expect(err).toBeInstanceOf(PatientNotFoundError);
      expect(err.name).toBe('PatientNotFoundError');
      expect(err.message).toBe('Patient could not be found.');
    });
  });
});
