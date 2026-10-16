import { describe, it, expect } from 'vitest';
import { Doctor, Patient } from '../models/models';
import { StoredAppointment } from './mock-hospital-data';
import {
  calculateConsultationFrequency,
  DateRange,
} from './consultation-frequency-engine';

describe('consultation-frequency-engine', () => {
  const PATIENT_MARIA: Patient = {
    id: '2001',
    name: 'Maria Gruber',
    ssn: '2001',
    insurance: 'ÖGK',
  };

  const PATIENT_JOHANN: Patient = {
    id: '2002',
    name: 'Johann Schmidt',
    ssn: '2002',
    insurance: 'SVS',
  };

  const PATIENT_ANNA: Patient = {
    id: '2003',
    name: 'Anna Fischer',
    ssn: '2003',
    insurance: 'BVAEB',
  };

  const DOCTOR_WEBER: Doctor = {
    id: '3001',
    name: 'Dr. Alexander Weber',
    ssn: '3001',
    specialty: 'Cardiology',
    position: 'Chief of Department',
    department: 'Cardiology',
  };

  const DOCTOR_JENKINS: Doctor = {
    id: '3002',
    name: 'Dr. Sarah Jenkins',
    ssn: '3002',
    specialty: 'Neurology',
    position: 'Attending',
    department: 'Neurology',
  };

  const DOCTOR_CHEN: Doctor = {
    id: '3003',
    name: 'Dr. Michael Chen',
    ssn: '3003',
    specialty: 'Orthopedics',
    position: 'Senior Resident',
    department: 'Orthopedics',
  };

  const STANDARD_RANGE: DateRange = {
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  };

  describe('Empty and Baseline Inputs', () => {
    it('should return empty results array when all inputs are empty', () => {
      const result = calculateConsultationFrequency([], [], [], STANDARD_RANGE);

      expect(result).toEqual({
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        results: [],
      });
    });

    it('should return empty results when appointments array is empty even if doctors and patients exist', () => {
      const result = calculateConsultationFrequency(
        [],
        [PATIENT_MARIA, PATIENT_JOHANN],
        [DOCTOR_WEBER, DOCTOR_JENKINS],
        STANDARD_RANGE,
      );

      expect(result.startDate).toBe('2026-01-01');
      expect(result.endDate).toBe('2026-12-31');
      expect(result.results).toEqual([]);
    });

    it('should handle inverted date ranges by returning empty results', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 1,
          date: '2026-05-15',
          time: '09:00',
          doctorSsn: '3001',
          patientSsn: '2001',
        },
      ];

      const invertedRange: DateRange = {
        startDate: '2026-12-31',
        endDate: '2026-01-01',
      };

      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA],
        [DOCTOR_WEBER],
        invertedRange,
      );

      expect(result.results).toEqual([]);
    });

    it('should handle missing or empty date range boundaries gracefully', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 1,
          date: '2026-05-15',
          time: '09:00',
          doctorSsn: '3001',
          patientSsn: '2001',
        },
      ];

      const invalidRange = { startDate: '', endDate: '' } as DateRange;
      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA],
        [DOCTOR_WEBER],
        invalidRange,
      );

      expect(result.results).toEqual([]);
    });
  });

  describe('Date Range Boundary Conditions', () => {
    it('should include appointments occurring on the exact startDate boundary', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 10,
          date: '2026-06-01',
          time: '08:00',
          doctorSsn: '3001',
          patientSsn: '2001',
        },
      ];

      const range: DateRange = {
        startDate: '2026-06-01',
        endDate: '2026-06-30',
      };

      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA],
        [DOCTOR_WEBER],
        range,
      );

      expect(result.results.length).toBe(1);
      expect(result.results[0].visitCount).toBe(1);
    });

    it('should include appointments occurring on the exact endDate boundary', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 11,
          date: '2026-06-30',
          time: '16:30',
          doctorSsn: '3001',
          patientSsn: '2001',
        },
      ];

      const range: DateRange = {
        startDate: '2026-06-01',
        endDate: '2026-06-30',
      };

      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA],
        [DOCTOR_WEBER],
        range,
      );

      expect(result.results.length).toBe(1);
      expect(result.results[0].visitCount).toBe(1);
    });

    it('should exclude appointments occurring one day before startDate', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 12,
          date: '2026-05-31',
          time: '17:00',
          doctorSsn: '3001',
          patientSsn: '2001',
        },
      ];

      const range: DateRange = {
        startDate: '2026-06-01',
        endDate: '2026-06-30',
      };

      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA],
        [DOCTOR_WEBER],
        range,
      );

      expect(result.results.length).toBe(0);
    });

    it('should exclude appointments occurring one day after endDate', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 13,
          date: '2026-07-01',
          time: '08:00',
          doctorSsn: '3001',
          patientSsn: '2001',
        },
      ];

      const range: DateRange = {
        startDate: '2026-06-01',
        endDate: '2026-06-30',
      };

      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA],
        [DOCTOR_WEBER],
        range,
      );

      expect(result.results.length).toBe(0);
    });

    it('should correctly handle a single-day date range (startDate === endDate)', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 14,
          date: '2026-05-10',
          time: '09:00',
          doctorSsn: '3001',
          patientSsn: '2001',
        },
        {
          id: 15,
          date: '2026-05-09',
          time: '10:00',
          doctorSsn: '3001',
          patientSsn: '2001',
        },
        {
          id: 16,
          date: '2026-05-11',
          time: '11:00',
          doctorSsn: '3001',
          patientSsn: '2001',
        },
      ];

      const singleDayRange: DateRange = {
        startDate: '2026-05-10',
        endDate: '2026-05-10',
      };

      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA],
        [DOCTOR_WEBER],
        singleDayRange,
      );

      expect(result.results.length).toBe(1);
      expect(result.results[0].patientSsn).toBe('2001');
      expect(result.results[0].visitCount).toBe(1);
    });

    it('should normalize ISO 8601 timestamp dates when comparing boundary conditions', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 17,
          date: '2026-06-30T15:30:00.000Z',
          time: '15:30',
          doctorSsn: '3001',
          patientSsn: '2001',
        },
        {
          id: 18,
          date: '2026-06-01T08:00:00.000Z',
          time: '08:00',
          doctorSsn: '3001',
          patientSsn: '2001',
        },
      ];

      const range: DateRange = {
        startDate: '2026-06-01',
        endDate: '2026-06-30',
      };

      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA],
        [DOCTOR_WEBER],
        range,
      );

      expect(result.results.length).toBe(1);
      expect(result.results[0].visitCount).toBe(2);
    });
  });

  describe('Multiple Visits Aggregation', () => {
    it('should aggregate a single visit count as 1', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 101,
          date: '2026-03-15',
          time: '10:00',
          doctorSsn: '3001',
          patientSsn: '2001',
        },
      ];

      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA],
        [DOCTOR_WEBER],
        STANDARD_RANGE,
      );

      expect(result.results).toEqual([
        {
          patientSsn: '2001',
          patientName: 'Maria Gruber',
          insurance: 'ÖGK',
          doctorSsn: '3001',
          doctorName: 'Dr. Alexander Weber',
          specialty: 'Cardiology',
          department: 'Cardiology',
          visitCount: 1,
        },
      ]);
    });

    it('should aggregate multiple visits across different dates for the same patient-doctor pair', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 102,
          date: '2026-02-10',
          time: '09:00',
          doctorSsn: '3001',
          patientSsn: '2001',
        },
        {
          id: 103,
          date: '2026-05-12',
          time: '11:00',
          doctorSsn: '3001',
          patientSsn: '2001',
        },
        {
          id: 104,
          date: '2026-08-20',
          time: '14:00',
          doctorSsn: '3001',
          patientSsn: '2001',
        },
      ];

      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA],
        [DOCTOR_WEBER],
        STANDARD_RANGE,
      );

      expect(result.results.length).toBe(1);
      expect(result.results[0].visitCount).toBe(3);
    });

    it('should aggregate multiple visits on the same date for the same patient-doctor pair', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 105,
          date: '2026-04-15',
          time: '08:30',
          doctorSsn: '3001',
          patientSsn: '2001',
        },
        {
          id: 106,
          date: '2026-04-15',
          time: '14:30',
          doctorSsn: '3001',
          patientSsn: '2001',
        },
      ];

      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA],
        [DOCTOR_WEBER],
        STANDARD_RANGE,
      );

      expect(result.results.length).toBe(1);
      expect(result.results[0].visitCount).toBe(2);
    });

    it('should create separate records when the same patient visits different doctors', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 107,
          date: '2026-03-01',
          time: '09:00',
          doctorSsn: '3001',
          patientSsn: '2001',
        },
        {
          id: 108,
          date: '2026-03-02',
          time: '10:00',
          doctorSsn: '3002',
          patientSsn: '2001',
        },
      ];

      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA],
        [DOCTOR_WEBER, DOCTOR_JENKINS],
        STANDARD_RANGE,
      );

      expect(result.results.length).toBe(2);
      const weberVisit = result.results.find((r) => r.doctorSsn === '3001');
      const jenkinsVisit = result.results.find((r) => r.doctorSsn === '3002');

      expect(weberVisit?.visitCount).toBe(1);
      expect(jenkinsVisit?.visitCount).toBe(1);
      expect(weberVisit?.patientSsn).toBe('2001');
      expect(jenkinsVisit?.patientSsn).toBe('2001');
    });

    it('should create separate records when different patients visit the same doctor', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 109,
          date: '2026-03-01',
          time: '09:00',
          doctorSsn: '3001',
          patientSsn: '2001',
        },
        {
          id: 110,
          date: '2026-03-01',
          time: '10:00',
          doctorSsn: '3001',
          patientSsn: '2002',
        },
      ];

      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA, PATIENT_JOHANN],
        [DOCTOR_WEBER],
        STANDARD_RANGE,
      );

      expect(result.results.length).toBe(2);
      const mariaVisit = result.results.find((r) => r.patientSsn === '2001');
      const johannVisit = result.results.find((r) => r.patientSsn === '2002');

      expect(mariaVisit?.doctorSsn).toBe('3001');
      expect(johannVisit?.doctorSsn).toBe('3001');
      expect(mariaVisit?.visitCount).toBe(1);
      expect(johannVisit?.visitCount).toBe(1);
    });

    it('should handle complex multi-patient multi-doctor distributions with varied counts', () => {
      const appointments: StoredAppointment[] = [
        { id: 201, date: '2026-01-10', time: '09:00', doctorSsn: '3001', patientSsn: '2001' },
        { id: 202, date: '2026-01-11', time: '09:00', doctorSsn: '3001', patientSsn: '2001' },
        { id: 203, date: '2026-01-12', time: '09:00', doctorSsn: '3001', patientSsn: '2001' },
        { id: 204, date: '2026-02-01', time: '10:00', doctorSsn: '3001', patientSsn: '2002' },
        { id: 205, date: '2026-02-15', time: '11:00', doctorSsn: '3002', patientSsn: '2003' },
        { id: 206, date: '2026-02-16', time: '11:00', doctorSsn: '3002', patientSsn: '2003' },
      ];

      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA, PATIENT_JOHANN, PATIENT_ANNA],
        [DOCTOR_WEBER, DOCTOR_JENKINS, DOCTOR_CHEN],
        STANDARD_RANGE,
      );

      expect(result.results.length).toBe(3);
      expect(result.results.find((r) => r.patientSsn === '2001' && r.doctorSsn === '3001')?.visitCount).toBe(3);
      expect(result.results.find((r) => r.patientSsn === '2002' && r.doctorSsn === '3001')?.visitCount).toBe(1);
      expect(result.results.find((r) => r.patientSsn === '2003' && r.doctorSsn === '3002')?.visitCount).toBe(2);
    });
  });

  describe('Unknown Doctor and Patient Fallbacks', () => {
    it('should fallback to "Unknown Patient" and empty insurance when patient is not in registry', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 301,
          date: '2026-04-10',
          time: '09:00',
          doctorSsn: '3001',
          patientSsn: 'UNREGISTERED_9999',
        },
      ];

      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA],
        [DOCTOR_WEBER],
        STANDARD_RANGE,
      );

      expect(result.results).toEqual([
        {
          patientSsn: 'UNREGISTERED_9999',
          patientName: 'Unknown Patient',
          insurance: '',
          doctorSsn: '3001',
          doctorName: 'Dr. Alexander Weber',
          specialty: 'Cardiology',
          department: 'Cardiology',
          visitCount: 1,
        },
      ]);
    });

    it('should fallback to "Unknown Doctor" and empty specialty/department when doctor is not in registry', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 302,
          date: '2026-04-10',
          time: '09:00',
          doctorSsn: 'DOC_EXTERNAL_8888',
          patientSsn: '2001',
        },
      ];

      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA],
        [DOCTOR_WEBER],
        STANDARD_RANGE,
      );

      expect(result.results).toEqual([
        {
          patientSsn: '2001',
          patientName: 'Maria Gruber',
          insurance: 'ÖGK',
          doctorSsn: 'DOC_EXTERNAL_8888',
          doctorName: 'Unknown Doctor',
          specialty: '',
          department: '',
          visitCount: 1,
        },
      ]);
    });

    it('should fallback both patient and doctor when neither is registered', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 303,
          date: '2026-04-10',
          time: '09:00',
          doctorSsn: 'DOC_9999',
          patientSsn: 'PAT_9999',
        },
      ];

      const result = calculateConsultationFrequency(appointments, [], [], STANDARD_RANGE);

      expect(result.results).toEqual([
        {
          patientSsn: 'PAT_9999',
          patientName: 'Unknown Patient',
          insurance: '',
          doctorSsn: 'DOC_9999',
          doctorName: 'Unknown Doctor',
          specialty: '',
          department: '',
          visitCount: 1,
        },
      ]);
    });

    it('should match patient by id if ssn is not directly matching', () => {
      const patientWithoutSsn: Patient = {
        id: '2050',
        name: 'Id-only Patient',
        ssn: '',
        insurance: 'None',
      };

      const appointments: StoredAppointment[] = [
        {
          id: 304,
          date: '2026-04-10',
          time: '09:00',
          doctorSsn: '3001',
          patientSsn: '2050',
        },
      ];

      const result = calculateConsultationFrequency(
        appointments,
        [patientWithoutSsn],
        [DOCTOR_WEBER],
        STANDARD_RANGE,
      );

      expect(result.results[0].patientName).toBe('Id-only Patient');
    });

    it('should match doctor by id if ssn is not directly matching', () => {
      const doctorWithoutSsn: Doctor = {
        id: '3050',
        name: 'Dr. Id-Only',
        ssn: '',
        specialty: 'Dermatology',
        position: 'Attending',
        department: 'Dermatology',
      };

      const appointments: StoredAppointment[] = [
        {
          id: 305,
          date: '2026-04-10',
          time: '09:00',
          doctorSsn: '3050',
          patientSsn: '2001',
        },
      ];

      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA],
        [doctorWithoutSsn],
        STANDARD_RANGE,
      );

      expect(result.results[0].doctorName).toBe('Dr. Id-Only');
      expect(result.results[0].specialty).toBe('Dermatology');
    });
  });

  describe('Ordering and Insertion Stability', () => {
    it('should preserve encounter order of patient-doctor pairs in the appointments array', () => {
      const appointments: StoredAppointment[] = [
        { id: 401, date: '2026-03-01', time: '09:00', doctorSsn: '3002', patientSsn: '2003' }, // Pair 1: Anna & Jenkins
        { id: 402, date: '2026-03-02', time: '10:00', doctorSsn: '3001', patientSsn: '2001' }, // Pair 2: Maria & Weber
        { id: 403, date: '2026-03-03', time: '11:00', doctorSsn: '3001', patientSsn: '2002' }, // Pair 3: Johann & Weber
      ];

      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA, PATIENT_JOHANN, PATIENT_ANNA],
        [DOCTOR_WEBER, DOCTOR_JENKINS],
        STANDARD_RANGE,
      );

      expect(result.results.map((r) => `${r.patientSsn}_${r.doctorSsn}`)).toEqual([
        '2003_3002',
        '2001_3001',
        '2002_3001',
      ]);
    });

    it('should maintain initial index position of an existing pair when subsequent appointments appear later', () => {
      const appointments: StoredAppointment[] = [
        { id: 404, date: '2026-03-01', time: '09:00', doctorSsn: '3002', patientSsn: '2003' }, // Pair 1
        { id: 405, date: '2026-03-02', time: '10:00', doctorSsn: '3001', patientSsn: '2001' }, // Pair 2
        { id: 406, date: '2026-03-03', time: '11:00', doctorSsn: '3002', patientSsn: '2003' }, // Pair 1 again
      ];

      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA, PATIENT_ANNA],
        [DOCTOR_WEBER, DOCTOR_JENKINS],
        STANDARD_RANGE,
      );

      expect(result.results.length).toBe(2);
      expect(result.results[0].patientSsn).toBe('2003');
      expect(result.results[0].doctorSsn).toBe('3002');
      expect(result.results[0].visitCount).toBe(2);
      expect(result.results[1].patientSsn).toBe('2001');
      expect(result.results[1].doctorSsn).toBe('3001');
      expect(result.results[1].visitCount).toBe(1);
    });
  });

  describe('Robustness and Data Integrity', () => {
    it('should safely skip null, undefined, or malformed appointments', () => {
      const appointments = [
        null as unknown as StoredAppointment,
        undefined as unknown as StoredAppointment,
        { id: 501, date: '', time: '09:00', doctorSsn: '3001', patientSsn: '2001' },
        { id: 502, date: '2026-05-01', time: '09:00', doctorSsn: '', patientSsn: '2001' },
        { id: 503, date: '2026-05-01', time: '09:00', doctorSsn: '3001', patientSsn: '' },
        { id: 504, date: '2026-05-01', time: '10:00', doctorSsn: '3001', patientSsn: '2001' },
      ];

      const result = calculateConsultationFrequency(
        appointments,
        [PATIENT_MARIA],
        [DOCTOR_WEBER],
        STANDARD_RANGE,
      );

      expect(result.results.length).toBe(1);
      expect(result.results[0].visitCount).toBe(1);
    });
  });
});
