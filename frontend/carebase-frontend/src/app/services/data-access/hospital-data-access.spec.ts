import { InjectionToken, Injectable, ResourceRef, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  HOSPITAL_DATA_ACCESS,
  SCHEDULING_DATA_ACCESS,
  CLINICAL_DATA_ACCESS,
  REPORTING_DATA_ACCESS,
  SYSTEM_DATA_ACCESS,
  HospitalDataAccess,
  HospitalDataError,
  AppointmentConflictError,
  BookingConflictError,
  PatientNotFoundError,
  provideHospitalDataAccessProviders,
  type ConsultationFrequencyReport,
  type PatientVisitsReport,
  type TimeSlotQueryParams,
  type TimeSlotsResult,
  type DateRange,
  type DoctorEarningsReport,
  type AddTreatmentResponse,
  type DatabaseSeedResponse,
  type DatabaseMigrationResponse,
} from './hospital-data-access';
import { InMemoryHospitalDataAdapter, provideTestHospitalData } from './in-memory-hospital-data-adapter';
import {
  Clerk,
  Doctor,
  Patient,
  Medication,
  Treatment,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  DbStatus,
} from '../../models/models';

@Injectable()
class DummyHospitalAdapter implements HospitalDataAccess {
  getDoctors(): ResourceRef<Doctor[]> {
    return {} as ResourceRef<Doctor[]>;
  }
  searchPatients(_query: Signal<string> | (() => string)): ResourceRef<Patient[]> {
    return {} as ResourceRef<Patient[]>;
  }
  getPatientDetails(_patientId: Signal<string | number | null> | (() => string | number | null)): ResourceRef<Patient | null> {
    return {} as ResourceRef<Patient | null>;
  }
  searchClerks(_query: Signal<string> | (() => string)): ResourceRef<Clerk[]> {
    return {} as ResourceRef<Clerk[]>;
  }
  getTimeSlots(_params: Signal<TimeSlotQueryParams | undefined> | (() => TimeSlotQueryParams | undefined)): ResourceRef<TimeSlotsResult | undefined> {
    return {} as ResourceRef<TimeSlotsResult | undefined>;
  }
  getMedications(_category?: Signal<string>): ResourceRef<Medication[]> {
    return {} as ResourceRef<Medication[]>;
  }
  getDoctorEarningsReport(_year: Signal<number> | (() => number)): ResourceRef<DoctorEarningsReport | undefined> {
    return {} as ResourceRef<DoctorEarningsReport | undefined>;
  }
  getConsultationFrequencyReport(_dateRange: Signal<DateRange | undefined> | (() => DateRange | undefined)): ResourceRef<ConsultationFrequencyReport | undefined> {
    return {} as ResourceRef<ConsultationFrequencyReport | undefined>;
  }
  async bookAppointment(_payload: CreateAppointmentRequest): Promise<CreateAppointmentResponse> {
    return { success: true };
  }
  async addTreatment(_patientId: string | number, _appointmentId: number, _treatment: Treatment): Promise<AddTreatmentResponse> {
    return { success: true };
  }
  getDatabaseStatus(): ResourceRef<DbStatus | undefined> {
    return {} as ResourceRef<DbStatus | undefined>;
  }
  async seedDatabase(): Promise<DatabaseSeedResponse> {
    return { success: true, message: 'seeded' };
  }
  async migrateDatabase(): Promise<DatabaseMigrationResponse> {
    return { success: true, message: 'migrated' };
  }
}

describe('HospitalDataAccess Port and Domain Errors', () => {
  describe('Injection Tokens', () => {
    it('should export HOSPITAL_DATA_ACCESS as an InjectionToken', () => {
      expect(HOSPITAL_DATA_ACCESS).toBeInstanceOf(InjectionToken);
      expect(HOSPITAL_DATA_ACCESS.toString()).toContain('HOSPITAL_DATA_ACCESS');
    });

    it('should export SCHEDULING_DATA_ACCESS as an InjectionToken', () => {
      expect(SCHEDULING_DATA_ACCESS).toBeInstanceOf(InjectionToken);
      expect(SCHEDULING_DATA_ACCESS.toString()).toContain('SCHEDULING_DATA_ACCESS');
    });

    it('should export CLINICAL_DATA_ACCESS as an InjectionToken', () => {
      expect(CLINICAL_DATA_ACCESS).toBeInstanceOf(InjectionToken);
      expect(CLINICAL_DATA_ACCESS.toString()).toContain('CLINICAL_DATA_ACCESS');
    });

    it('should export REPORTING_DATA_ACCESS as an InjectionToken', () => {
      expect(REPORTING_DATA_ACCESS).toBeInstanceOf(InjectionToken);
      expect(REPORTING_DATA_ACCESS.toString()).toContain('REPORTING_DATA_ACCESS');
    });

    it('should export SYSTEM_DATA_ACCESS as an InjectionToken', () => {
      expect(SYSTEM_DATA_ACCESS).toBeInstanceOf(InjectionToken);
      expect(SYSTEM_DATA_ACCESS.toString()).toContain('SYSTEM_DATA_ACCESS');
    });
  });

  describe('Report Type Compatibility', () => {
    it('should support ConsultationFrequencyReport and backwards-compatible PatientVisitsReport alias', () => {
      const report: ConsultationFrequencyReport = {
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        results: [],
      };
      const legacyReport: PatientVisitsReport = report;
      expect(legacyReport.startDate).toBe('2026-01-01');
      expect(legacyReport.results).toEqual([]);
    });
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

    it('AppointmentConflictError should extend HospitalDataError and be aliased by BookingConflictError', () => {
      const err = new AppointmentConflictError();
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(HospitalDataError);
      expect(err).toBeInstanceOf(AppointmentConflictError);
      expect(err).toBeInstanceOf(BookingConflictError);
      expect(err.name).toBe('AppointmentConflictError');
      expect(err.message).toBe('Appointment scheduling conflict.');
    });

    it('AppointmentConflictError should support custom message and cause', () => {
      const err = new AppointmentConflictError('Slot taken', { status: 409 });
      expect(err.message).toBe('Slot taken');
      expect(err.cause).toEqual({ status: 409 });
    });

    it('BookingConflictError should alias AppointmentConflictError for backward compatibility', () => {
      expect(BookingConflictError).toBe(AppointmentConflictError);
      const bookingErr = new BookingConflictError();
      expect(bookingErr).toBeInstanceOf(AppointmentConflictError);
      expect(bookingErr).toBeInstanceOf(HospitalDataError);
      expect(bookingErr.name).toBe('AppointmentConflictError');
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

  describe('Capability Interface Segregation & DI Aliasing', () => {
    it('should alias all capability tokens to the same master adapter via provideHospitalDataAccessProviders', () => {
      TestBed.configureTestingModule({
        providers: [provideHospitalDataAccessProviders(InMemoryHospitalDataAdapter)],
      });

      const master = TestBed.inject(HOSPITAL_DATA_ACCESS);
      const scheduling = TestBed.inject(SCHEDULING_DATA_ACCESS);
      const clinical = TestBed.inject(CLINICAL_DATA_ACCESS);
      const reporting = TestBed.inject(REPORTING_DATA_ACCESS);
      const system = TestBed.inject(SYSTEM_DATA_ACCESS);

      expect(master).toBeInstanceOf(InMemoryHospitalDataAdapter);
      expect(scheduling).toBe(master);
      expect(clinical).toBe(master);
      expect(reporting).toBe(master);
      expect(system).toBe(master);
    });

    it('should alias all capability tokens to custom adapter stub via provideHospitalDataAccessProviders', () => {
      TestBed.configureTestingModule({
        providers: [provideHospitalDataAccessProviders(DummyHospitalAdapter)],
      });

      const master = TestBed.inject(HOSPITAL_DATA_ACCESS);
      const scheduling = TestBed.inject(SCHEDULING_DATA_ACCESS);
      const clinical = TestBed.inject(CLINICAL_DATA_ACCESS);
      const reporting = TestBed.inject(REPORTING_DATA_ACCESS);
      const system = TestBed.inject(SYSTEM_DATA_ACCESS);

      expect(master).toBeInstanceOf(DummyHospitalAdapter);
      expect(scheduling).toBe(master);
      expect(clinical).toBe(master);
      expect(reporting).toBe(master);
      expect(system).toBe(master);
    });

    it('should ensure provideTestHospitalData aliases all capability tokens to HOSPITAL_DATA_ACCESS', () => {
      TestBed.configureTestingModule({
        providers: [provideTestHospitalData()],
      });

      const master = TestBed.inject(HOSPITAL_DATA_ACCESS);
      const scheduling = TestBed.inject(SCHEDULING_DATA_ACCESS);
      const clinical = TestBed.inject(CLINICAL_DATA_ACCESS);
      const reporting = TestBed.inject(REPORTING_DATA_ACCESS);
      const system = TestBed.inject(SYSTEM_DATA_ACCESS);

      expect(master).toBeInstanceOf(InMemoryHospitalDataAdapter);
      expect(scheduling).toBe(master);
      expect(clinical).toBe(master);
      expect(reporting).toBe(master);
      expect(system).toBe(master);
    });
  });
});
