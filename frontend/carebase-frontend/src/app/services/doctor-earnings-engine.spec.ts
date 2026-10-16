import { describe, it, expect } from 'vitest';
import { Doctor } from '../models/models';
import { StoredAppointment } from './mock-hospital-data';
import { calculateDoctorEarnings } from './doctor-earnings-engine';

describe('doctor-earnings-engine', () => {
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

  describe('Empty and Baseline Inputs', () => {
    it('should return empty data array when both doctors and appointments are empty', () => {
      const result = calculateDoctorEarnings([], [], 2026);

      expect(result).toEqual({
        year: 2026,
        data: [],
      });
    });

    it('should return empty data array when doctors array is empty even if appointments exist', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 1,
          date: '2026-03-15',
          time: '09:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: 'ECG', cost: 250, medications: [] },
        },
      ];

      const result = calculateDoctorEarnings([], appointments, 2026);

      expect(result.year).toBe(2026);
      expect(result.data).toEqual([]);
    });

    it('should return all doctors with totalCosts 0 when appointments array is empty', () => {
      const doctors = [DOCTOR_WEBER, DOCTOR_JENKINS];

      const result = calculateDoctorEarnings(doctors, [], 2026);

      expect(result.year).toBe(2026);
      expect(result.data.length).toBe(2);
      expect(result.data[0]).toEqual({
        id: 3001,
        name: 'Dr. Alexander Weber',
        specialty: 'Cardiology',
        department: 'Cardiology',
        year: 2026,
        totalCosts: 0,
      });
      expect(result.data[1]).toEqual({
        id: 3002,
        name: 'Dr. Sarah Jenkins',
        specialty: 'Neurology',
        department: 'Neurology',
        year: 2026,
        totalCosts: 0,
      });
    });

    it('should echo the requested year in the report and each doctor record', () => {
      const result = calculateDoctorEarnings([DOCTOR_WEBER], [], 2024);

      expect(result.year).toBe(2024);
      expect(result.data[0].year).toBe(2024);
    });
  });

  describe('Zero-Treatment Doctors', () => {
    it('should calculate 0 totalCosts for a doctor with appointments but no treatments recorded', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 10,
          date: '2026-02-10',
          time: '10:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          reason: 'Initial consultation',
          // no treatment
        },
        {
          id: 11,
          date: '2026-05-12',
          time: '14:00',
          doctorSsn: '3001',
          patientSsn: '2002',
          reason: 'Follow-up checkup',
          // treatment undefined
        },
      ];

      const result = calculateDoctorEarnings([DOCTOR_WEBER], appointments, 2026);

      expect(result.data[0].totalCosts).toBe(0);
    });

    it('should handle treatment with cost of 0 EUR', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 20,
          date: '2026-04-01',
          time: '11:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: 'Routine checkup (pro bono)', cost: 0, medications: [] },
        },
      ];

      const result = calculateDoctorEarnings([DOCTOR_WEBER], appointments, 2026);

      expect(result.data[0].totalCosts).toBe(0);
    });

    it('should accurately report 0 totalCosts for doctors without appointments alongside active doctors', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 30,
          date: '2026-06-01',
          time: '09:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: 'Angiogram', cost: 500, medications: [] },
        },
      ];

      const result = calculateDoctorEarnings(
        [DOCTOR_WEBER, DOCTOR_JENKINS, DOCTOR_CHEN],
        appointments,
        2026,
      );

      expect(result.data.find((d) => d.id === 3001)?.totalCosts).toBe(500);
      expect(result.data.find((d) => d.id === 3002)?.totalCosts).toBe(0);
      expect(result.data.find((d) => d.id === 3003)?.totalCosts).toBe(0);
    });
  });

  describe('Single and Multiple Treatment Aggregations', () => {
    it('should aggregate single treatment cost for a doctor', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 101,
          date: '2026-01-15',
          time: '08:30',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: 'Echocardiogram', cost: 250, medications: [] },
        },
      ];

      const result = calculateDoctorEarnings([DOCTOR_WEBER], appointments, 2026);

      expect(result.data[0].totalCosts).toBe(250);
    });

    it('should aggregate multiple treatments across different dates for the same doctor', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 101,
          date: '2026-01-15',
          time: '08:30',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: 'Echocardiogram', cost: 250, medications: [] },
        },
        {
          id: 102,
          date: '2026-04-20',
          time: '10:00',
          doctorSsn: '3001',
          patientSsn: '2002',
          treatment: { description: 'Stress test', cost: 350, medications: [] },
        },
        {
          id: 103,
          date: '2026-09-05',
          time: '15:30',
          doctorSsn: '3001',
          patientSsn: '2003',
          treatment: { description: 'Holter monitor review', cost: 120, medications: [] },
        },
      ];

      const result = calculateDoctorEarnings([DOCTOR_WEBER], appointments, 2026);

      expect(result.data[0].totalCosts).toBe(720);
    });

    it('should aggregate multiple treatments on the same day for the same doctor', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 104,
          date: '2026-03-10',
          time: '09:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: 'Morning consultation', cost: 150, medications: [] },
        },
        {
          id: 105,
          date: '2026-03-10',
          time: '14:00',
          doctorSsn: '3001',
          patientSsn: '2002',
          treatment: { description: 'Afternoon treatment', cost: 450, medications: [] },
        },
      ];

      const result = calculateDoctorEarnings([DOCTOR_WEBER], appointments, 2026);

      expect(result.data[0].totalCosts).toBe(600);
    });

    it('should aggregate treatments independently for multiple doctors', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 201,
          date: '2026-02-01',
          time: '09:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: 'Cardio treatment A', cost: 300, medications: [] },
        },
        {
          id: 202,
          date: '2026-02-01',
          time: '11:00',
          doctorSsn: '3002',
          patientSsn: '2002',
          treatment: { description: 'Neuro treatment A', cost: 400, medications: [] },
        },
        {
          id: 203,
          date: '2026-03-01',
          time: '14:00',
          doctorSsn: '3001',
          patientSsn: '2003',
          treatment: { description: 'Cardio treatment B', cost: 200, medications: [] },
        },
        {
          id: 204,
          date: '2026-05-15',
          time: '16:00',
          doctorSsn: '3002',
          patientSsn: '2004',
          treatment: { description: 'Neuro treatment B', cost: 600, medications: [] },
        },
      ];

      const result = calculateDoctorEarnings([DOCTOR_WEBER, DOCTOR_JENKINS], appointments, 2026);

      const weber = result.data.find((d) => d.id === 3001);
      const jenkins = result.data.find((d) => d.id === 3002);

      expect(weber?.totalCosts).toBe(500); // 300 + 200
      expect(jenkins?.totalCosts).toBe(1000); // 400 + 600
    });
  });

  describe('Target Year and Cross-Year Filtering', () => {
    it('should exclude treatments from prior years', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 301,
          date: '2025-11-20',
          time: '10:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: '2025 Treatment', cost: 500, medications: [] },
        },
        {
          id: 302,
          date: '2026-01-10',
          time: '10:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: '2026 Treatment', cost: 200, medications: [] },
        },
      ];

      const result = calculateDoctorEarnings([DOCTOR_WEBER], appointments, 2026);

      expect(result.data[0].totalCosts).toBe(200);
    });

    it('should exclude treatments from future years', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 303,
          date: '2026-08-15',
          time: '10:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: '2026 Treatment', cost: 350, medications: [] },
        },
        {
          id: 304,
          date: '2027-01-05',
          time: '10:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: '2027 Treatment', cost: 400, medications: [] },
        },
      ];

      const result = calculateDoctorEarnings([DOCTOR_WEBER], appointments, 2026);

      expect(result.data[0].totalCosts).toBe(350);
    });

    it('should correctly filter cross-year spans spanning 2024 through 2027', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 401,
          date: '2024-06-01',
          time: '09:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: '2024 treatment', cost: 100, medications: [] },
        },
        {
          id: 402,
          date: '2025-06-01',
          time: '09:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: '2025 treatment', cost: 200, medications: [] },
        },
        {
          id: 403,
          date: '2026-06-01',
          time: '09:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: '2026 treatment A', cost: 300, medications: [] },
        },
        {
          id: 404,
          date: '2026-10-01',
          time: '09:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: '2026 treatment B', cost: 400, medications: [] },
        },
        {
          id: 405,
          date: '2027-02-01',
          time: '09:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: '2027 treatment', cost: 500, medications: [] },
        },
      ];

      expect(calculateDoctorEarnings([DOCTOR_WEBER], appointments, 2024).data[0].totalCosts).toBe(
        100,
      );
      expect(calculateDoctorEarnings([DOCTOR_WEBER], appointments, 2025).data[0].totalCosts).toBe(
        200,
      );
      expect(calculateDoctorEarnings([DOCTOR_WEBER], appointments, 2026).data[0].totalCosts).toBe(
        700,
      );
      expect(calculateDoctorEarnings([DOCTOR_WEBER], appointments, 2027).data[0].totalCosts).toBe(
        500,
      );
      expect(calculateDoctorEarnings([DOCTOR_WEBER], appointments, 2028).data[0].totalCosts).toBe(
        0,
      );
    });

    it('should include treatments on exact year boundaries (Jan 1 and Dec 31)', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 501,
          date: '2026-01-01',
          time: '08:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: 'New Year Day treatment', cost: 175, medications: [] },
        },
        {
          id: 502,
          date: '2026-12-31',
          time: '16:30',
          doctorSsn: '3001',
          patientSsn: '2002',
          treatment: { description: 'New Year Eve treatment', cost: 225, medications: [] },
        },
        {
          id: 503,
          date: '2025-12-31',
          time: '23:59',
          doctorSsn: '3001',
          patientSsn: '2003',
          treatment: { description: 'Previous year eve', cost: 999, medications: [] },
        },
        {
          id: 504,
          date: '2027-01-01',
          time: '00:01',
          doctorSsn: '3001',
          patientSsn: '2004',
          treatment: { description: 'Next year day', cost: 888, medications: [] },
        },
      ];

      const result = calculateDoctorEarnings([DOCTOR_WEBER], appointments, 2026);

      expect(result.data[0].totalCosts).toBe(400); // 175 + 225
    });
  });

  describe('Doctor Metadata and Ordering', () => {
    it('should convert doctor string ID to number in output', () => {
      const doctor: Doctor = {
        id: '4567',
        name: 'Dr. Test',
        ssn: '4567',
        specialty: 'Radiology',
        position: 'Attending',
        department: 'Radiology',
      };

      const result = calculateDoctorEarnings([doctor], [], 2026);

      expect(typeof result.data[0].id).toBe('number');
      expect(result.data[0].id).toBe(4567);
    });

    it('should preserve doctor.id 0 when id is "0"', () => {
      const doctor: Doctor = {
        id: '0',
        name: 'Dr. Zero',
        ssn: '0000',
        specialty: 'Emergency',
        position: 'Resident',
        department: 'Emergency',
      };

      const result = calculateDoctorEarnings([doctor], [], 2026);

      expect(result.data[0].id).toBe(0);
    });

    it('should preserve all doctor attributes accurately', () => {
      const result = calculateDoctorEarnings([DOCTOR_CHEN], [], 2026);

      expect(result.data[0]).toEqual({
        id: 3003,
        name: 'Dr. Michael Chen',
        specialty: 'Orthopedics',
        department: 'Orthopedics',
        year: 2026,
        totalCosts: 0,
      });
    });

    it('should preserve exact array order of doctors provided in input', () => {
      const inputDoctors = [DOCTOR_CHEN, DOCTOR_WEBER, DOCTOR_JENKINS];

      const result = calculateDoctorEarnings(inputDoctors, [], 2026);

      expect(result.data.map((d) => d.id)).toEqual([3003, 3001, 3002]);
    });
  });

  describe('Date Formats and Edge Cases', () => {
    it('should handle ISO 8601 timestamps starting with target year', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 601,
          date: '2026-07-15T10:30:00.000Z',
          time: '10:30',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: 'ISO date treatment', cost: 420, medications: [] },
        },
      ];

      const result = calculateDoctorEarnings([DOCTOR_WEBER], appointments, 2026);

      expect(result.data[0].totalCosts).toBe(420);
    });

    it('should handle decimal costs properly', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 701,
          date: '2026-03-01',
          time: '09:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: 'Medication A', cost: 120.5, medications: [] },
        },
        {
          id: 702,
          date: '2026-03-02',
          time: '10:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: 'Medication B', cost: 79.5, medications: [] },
        },
      ];

      const result = calculateDoctorEarnings([DOCTOR_WEBER], appointments, 2026);

      expect(result.data[0].totalCosts).toBe(200);
    });

    it('should ignore appointments with non-matching doctorSsn without affecting registered doctors', () => {
      const appointments: StoredAppointment[] = [
        {
          id: 801,
          date: '2026-04-10',
          time: '10:00',
          doctorSsn: 'UNKNOWN_9999',
          patientSsn: '2001',
          treatment: { description: 'External doctor treatment', cost: 1000, medications: [] },
        },
      ];

      const result = calculateDoctorEarnings([DOCTOR_WEBER], appointments, 2026);

      expect(result.data[0].totalCosts).toBe(0);
    });

    it('should safely ignore null/undefined appointments or appointments without valid dates', () => {
      const appointments = [
        null as unknown as StoredAppointment,
        undefined as unknown as StoredAppointment,
        {
          id: 901,
          date: '',
          time: '09:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: 'Invalid date treatment', cost: 500, medications: [] },
        },
        {
          id: 902,
          date: '2026-05-01',
          time: '10:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: 'Valid treatment', cost: 300, medications: [] },
        },
      ];

      const result = calculateDoctorEarnings([DOCTOR_WEBER], appointments, 2026);

      expect(result.data[0].totalCosts).toBe(300);
    });

    it('should ignore treatments with non-numeric cost values', () => {
      const appointments = [
        {
          id: 903,
          date: '2026-05-01',
          time: '10:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: {
            description: 'Corrupted cost',
            cost: 'NaN' as unknown as number,
            medications: [],
          },
        },
        {
          id: 904,
          date: '2026-05-01',
          time: '11:00',
          doctorSsn: '3001',
          patientSsn: '2001',
          treatment: { description: 'Valid', cost: 150, medications: [] },
        },
      ];

      const result = calculateDoctorEarnings([DOCTOR_WEBER], appointments, 2026);

      expect(result.data[0].totalCosts).toBe(150);
    });
  });
});
