import { describe, it, expect } from 'vitest';
import * as RootServices from './index';
import * as EnginesBarrel from './engines';
import * as DataAccessBarrel from './data-access';

describe('Services Sub-Domain and Root Barrels', () => {
  describe('engines barrel', () => {
    it('exports time-slot engine calculation functions and constants', () => {
      expect(typeof EnginesBarrel.calculateTimeSlots).toBe('function');
      expect(typeof EnginesBarrel.calculateSlots).toBe('function');
      expect(Array.isArray(EnginesBarrel.DAILY_OPERATING_SLOTS)).toBe(true);
      expect(EnginesBarrel.SLOTS_PER_DAY).toBe(19);
      expect(EnginesBarrel.LOOKAHEAD_WINDOW_DAYS).toBe(14);
    });

    it('exports doctor earnings engine calculation function', () => {
      expect(typeof EnginesBarrel.calculateDoctorEarnings).toBe('function');
    });

    it('exports consultation frequency engine calculation function', () => {
      expect(typeof EnginesBarrel.calculateConsultationFrequency).toBe('function');
    });
  });

  describe('data-access barrel', () => {
    it('exports hospital data access injection token and domain errors', () => {
      expect(DataAccessBarrel.HOSPITAL_DATA_ACCESS).toBeDefined();
      expect(DataAccessBarrel.SCHEDULING_DATA_ACCESS).toBeDefined();
      expect(DataAccessBarrel.CLINICAL_DATA_ACCESS).toBeDefined();
      expect(DataAccessBarrel.REPORTING_DATA_ACCESS).toBeDefined();
      expect(DataAccessBarrel.SYSTEM_DATA_ACCESS).toBeDefined();
      expect(typeof DataAccessBarrel.HospitalDataError).toBe('function');
      expect(typeof DataAccessBarrel.BookingConflictError).toBe('function');
      expect(typeof DataAccessBarrel.PatientNotFoundError).toBe('function');
    });

    it('exports adapters and provider helpers', () => {
      expect(typeof DataAccessBarrel.HttpHospitalDataAdapter).toBe('function');
      expect(typeof DataAccessBarrel.InMemoryHospitalDataAdapter).toBe('function');
      expect(DataAccessBarrel.IN_MEMORY_ADAPTER_CONFIG).toBeDefined();
      expect(typeof DataAccessBarrel.provideHospitalDataAccessProviders).toBe('function');
      expect(typeof DataAccessBarrel.provideTestHospitalData).toBe('function');
      expect(typeof DataAccessBarrel.createDemoHospitalData).toBe('function');
      expect(typeof DataAccessBarrel.createMinimalHospitalData).toBe('function');
    });
  });

  describe('root services barrel', () => {
    it('re-exports engines symbols', () => {
      expect(typeof RootServices.calculateTimeSlots).toBe('function');
      expect(typeof RootServices.calculateSlots).toBe('function');
      expect(typeof RootServices.calculateDoctorEarnings).toBe('function');
      expect(typeof RootServices.calculateConsultationFrequency).toBe('function');
    });

    it('re-exports data-access symbols', () => {
      expect(RootServices.HOSPITAL_DATA_ACCESS).toBeDefined();
      expect(RootServices.SCHEDULING_DATA_ACCESS).toBeDefined();
      expect(RootServices.CLINICAL_DATA_ACCESS).toBeDefined();
      expect(RootServices.REPORTING_DATA_ACCESS).toBeDefined();
      expect(RootServices.SYSTEM_DATA_ACCESS).toBeDefined();
      expect(typeof RootServices.provideHospitalDataAccessProviders).toBe('function');
      expect(typeof RootServices.HttpHospitalDataAdapter).toBe('function');
      expect(typeof RootServices.InMemoryHospitalDataAdapter).toBe('function');
      expect(typeof RootServices.provideTestHospitalData).toBe('function');
      expect(typeof RootServices.BookingConflictError).toBe('function');
    });

    it('re-exports session and operation runner root services', () => {
      expect(typeof RootServices.ActorSession).toBe('function');
      expect(RootServices.SESSION_STORAGE_KEY).toBeDefined();
      expect(typeof RootServices.OperationRunner).toBe('function');
      expect(typeof RootServices.HeadlessSnackBar).toBe('function');
      expect(typeof RootServices.HeadlessDialog).toBe('function');
      expect(typeof RootServices.provideTestOperationRunner).toBe('function');
      expect(typeof RootServices.resolveDefaultErrorMessage).toBe('function');
    });
  });
});
