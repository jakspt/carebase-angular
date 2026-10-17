import { describe, it, expect } from 'vitest';
import {
  calculateTimeSlots,
  calculateSlots,
  DAILY_OPERATING_SLOTS,
  SLOTS_PER_DAY,
  LOOKAHEAD_WINDOW_DAYS,
  TimeSlotAppointment,
} from './time-slot-engine';

describe('time-slot-engine', () => {
  const DOCTOR_A = 'DOC-100';
  const DOCTOR_B = 'DOC-200';
  const PATIENT_A = 'PAT-300';
  const PATIENT_B = 'PAT-400';
  const TARGET_DATE = '2026-06-15';

  describe('Slot Generation and Baseline Availability', () => {
    it('should generate exactly 19 slots between 08:00 and 17:00 in 30-minute intervals', () => {
      const result = calculateTimeSlots([], {
        date: TARGET_DATE,
        doctorSsn: DOCTOR_A,
      });

      expect(result.slots.length).toBe(SLOTS_PER_DAY);
      expect(result.slots.length).toBe(19);
      expect(result.slots[0].time).toBe('08:00');
      expect(result.slots[result.slots.length - 1].time).toBe('17:00');
      expect(result.slots.map((s) => s.time)).toEqual(DAILY_OPERATING_SLOTS);
    });

    it('should mark all slots available and nextAvailableDate null when no appointments exist', () => {
      const result = calculateTimeSlots([], {
        date: TARGET_DATE,
        doctorSsn: DOCTOR_A,
        patientSsn: PATIENT_A,
      });

      expect(result.date).toBe(TARGET_DATE);
      expect(result.doctorSsn).toBe(DOCTOR_A);
      expect(result.patientSsn).toBe(PATIENT_A);
      expect(result.slots.every((s) => s.available)).toBe(true);
      expect(result.nextAvailableDate).toBeNull();
    });

    it('should properly strip time from ISO date format', () => {
      const result = calculateTimeSlots([], {
        date: '2026-06-15T14:30:00.000Z',
        doctorSsn: DOCTOR_A,
      });

      expect(result.date).toBe('2026-06-15');
      expect(result.slots.every((s) => s.available)).toBe(true);
    });

    it('should alias calculateSlots to calculateTimeSlots', () => {
      expect(calculateSlots).toBe(calculateTimeSlots);
    });
  });

  describe('Doctor Conflict Filtering', () => {
    it('should mark a slot unavailable when the requested doctor is booked at that time', () => {
      const appointments: TimeSlotAppointment[] = [
        {
          date: TARGET_DATE,
          time: '09:00',
          doctorSsn: DOCTOR_A,
          patientSsn: PATIENT_B,
        },
      ];

      const result = calculateTimeSlots(appointments, {
        date: TARGET_DATE,
        doctorSsn: DOCTOR_A,
      });

      const slot0900 = result.slots.find((s) => s.time === '09:00');
      expect(slot0900?.available).toBe(false);

      const availableSlots = result.slots.filter((s) => s.available);
      expect(availableSlots.length).toBe(18);
      expect(result.nextAvailableDate).toBeNull();
    });

    it('should mark multiple slots unavailable when doctor has multiple bookings', () => {
      const appointments: TimeSlotAppointment[] = [
        { date: TARGET_DATE, time: '08:00', doctorSsn: DOCTOR_A, patientSsn: 'P1' },
        { date: TARGET_DATE, time: '11:30', doctorSsn: DOCTOR_A, patientSsn: 'P2' },
        { date: TARGET_DATE, time: '16:00', doctorSsn: DOCTOR_A, patientSsn: 'P3' },
      ];

      const result = calculateTimeSlots(appointments, {
        date: TARGET_DATE,
        doctorSsn: DOCTOR_A,
      });

      expect(result.slots.find((s) => s.time === '08:00')?.available).toBe(false);
      expect(result.slots.find((s) => s.time === '11:30')?.available).toBe(false);
      expect(result.slots.find((s) => s.time === '16:00')?.available).toBe(false);
      expect(result.slots.filter((s) => s.available).length).toBe(16);
    });

    it('should ignore appointments for other doctors at the same time and date', () => {
      const appointments: TimeSlotAppointment[] = [
        {
          date: TARGET_DATE,
          time: '09:00',
          doctorSsn: DOCTOR_B,
          patientSsn: PATIENT_B,
        },
      ];

      const result = calculateTimeSlots(appointments, {
        date: TARGET_DATE,
        doctorSsn: DOCTOR_A,
      });

      expect(result.slots.every((s) => s.available)).toBe(true);
    });

    it('should ignore appointments for the requested doctor on a different date', () => {
      const appointments: TimeSlotAppointment[] = [
        {
          date: '2026-06-16',
          time: '09:00',
          doctorSsn: DOCTOR_A,
          patientSsn: PATIENT_A,
        },
      ];

      const result = calculateTimeSlots(appointments, {
        date: TARGET_DATE,
        doctorSsn: DOCTOR_A,
      });

      expect(result.slots.every((s) => s.available)).toBe(true);
    });
  });

  describe('Patient Conflict Filtering', () => {
    it('should mark slot unavailable when the requested patient has an appointment with another doctor', () => {
      const appointments: TimeSlotAppointment[] = [
        {
          date: TARGET_DATE,
          time: '10:00',
          doctorSsn: DOCTOR_B,
          patientSsn: PATIENT_A,
        },
      ];

      const result = calculateTimeSlots(appointments, {
        date: TARGET_DATE,
        doctorSsn: DOCTOR_A,
        patientSsn: PATIENT_A,
      });

      expect(result.slots.find((s) => s.time === '10:00')?.available).toBe(false);
      expect(result.slots.filter((s) => s.available).length).toBe(18);
    });

    it('should not filter patient conflicts if patientSsn is omitted or undefined', () => {
      const appointments: TimeSlotAppointment[] = [
        {
          date: TARGET_DATE,
          time: '10:00',
          doctorSsn: DOCTOR_B,
          patientSsn: PATIENT_A,
        },
      ];

      const resultWithoutPatient = calculateTimeSlots(appointments, {
        date: TARGET_DATE,
        doctorSsn: DOCTOR_A,
      });

      expect(resultWithoutPatient.slots.every((s) => s.available)).toBe(true);
    });

    it('should filter both doctor conflicts and patient conflicts on distinct slots', () => {
      const appointments: TimeSlotAppointment[] = [
        {
          date: TARGET_DATE,
          time: '08:30',
          doctorSsn: DOCTOR_A,
          patientSsn: 'OTHER_PAT',
        },
        {
          date: TARGET_DATE,
          time: '14:00',
          doctorSsn: DOCTOR_B,
          patientSsn: PATIENT_A,
        },
      ];

      const result = calculateTimeSlots(appointments, {
        date: TARGET_DATE,
        doctorSsn: DOCTOR_A,
        patientSsn: PATIENT_A,
      });

      expect(result.slots.find((s) => s.time === '08:30')?.available).toBe(false);
      expect(result.slots.find((s) => s.time === '14:00')?.available).toBe(false);
      expect(result.slots.filter((s) => s.available).length).toBe(17);
    });

    it('should handle duplicate conflicts when both doctor and patient are booked in the same slot', () => {
      const appointments: TimeSlotAppointment[] = [
        {
          date: TARGET_DATE,
          time: '09:00',
          doctorSsn: DOCTOR_A,
          patientSsn: PATIENT_A,
        },
      ];

      const result = calculateTimeSlots(appointments, {
        date: TARGET_DATE,
        doctorSsn: DOCTOR_A,
        patientSsn: PATIENT_A,
      });

      expect(result.slots.find((s) => s.time === '09:00')?.available).toBe(false);
      expect(result.slots.filter((s) => s.available).length).toBe(18);
    });
  });

  describe('Fully Booked Days and 14-Day Forward Lookahead', () => {
    function bookAllSlots(
      date: string,
      doctorSsn: string,
      patientSsn: string = 'SOME_PATIENT',
    ): TimeSlotAppointment[] {
      return DAILY_OPERATING_SLOTS.map((time) => ({
        date,
        time,
        doctorSsn,
        patientSsn,
      }));
    }

    it('should return nextAvailableDate as the very next day when requested day is fully booked', () => {
      const appointments = bookAllSlots(TARGET_DATE, DOCTOR_A);

      const result = calculateTimeSlots(appointments, {
        date: TARGET_DATE,
        doctorSsn: DOCTOR_A,
      });

      expect(result.slots.every((s) => !s.available)).toBe(true);
      expect(result.nextAvailableDate).toBe('2026-06-16');
    });

    it('should keep nextAvailableDate null if even one slot is available on the requested day', () => {
      // Book 18 slots out of 19
      const appointments = DAILY_OPERATING_SLOTS.slice(0, 18).map((time) => ({
        date: TARGET_DATE,
        time,
        doctorSsn: DOCTOR_A,
        patientSsn: PATIENT_A,
      }));

      const result = calculateTimeSlots(appointments, {
        date: TARGET_DATE,
        doctorSsn: DOCTOR_A,
      });

      expect(result.slots.some((s) => s.available)).toBe(true);
      expect(result.slots.find((s) => s.time === '17:00')?.available).toBe(true);
      expect(result.nextAvailableDate).toBeNull();
    });

    it('should skip fully booked intermediate days and return first day with open slots', () => {
      const appointments = [
        ...bookAllSlots(TARGET_DATE, DOCTOR_A),
        ...bookAllSlots('2026-06-16', DOCTOR_A),
        ...bookAllSlots('2026-06-17', DOCTOR_A),
      ];

      const result = calculateTimeSlots(appointments, {
        date: TARGET_DATE,
        doctorSsn: DOCTOR_A,
      });

      expect(result.nextAvailableDate).toBe('2026-06-18');
    });

    it('should find next available date on exact boundary of 14-day window (day + 14)', () => {
      const appointments: TimeSlotAppointment[] = [...bookAllSlots(TARGET_DATE, DOCTOR_A)];

      // Book days 1 through 13 forward: 2026-06-16 through 2026-06-28
      for (let offset = 1; offset <= 13; offset++) {
        const d = new Date(2026, 5, 15 + offset);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        appointments.push(...bookAllSlots(`${y}-${m}-${day}`, DOCTOR_A));
      }

      const result = calculateTimeSlots(appointments, {
        date: TARGET_DATE,
        doctorSsn: DOCTOR_A,
      });

      // Day 14 is 2026-06-29, which is within the 14-day window and has open slots
      expect(result.nextAvailableDate).toBe('2026-06-29');
    });

    it('should return null when all 14 days in the forward window are fully booked', () => {
      const appointments: TimeSlotAppointment[] = [...bookAllSlots(TARGET_DATE, DOCTOR_A)];

      // Book all 14 days forward: 2026-06-16 through 2026-06-29
      for (let offset = 1; offset <= LOOKAHEAD_WINDOW_DAYS; offset++) {
        const d = new Date(2026, 5, 15 + offset);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        appointments.push(...bookAllSlots(`${y}-${m}-${day}`, DOCTOR_A));
      }

      const result = calculateTimeSlots(appointments, {
        date: TARGET_DATE,
        doctorSsn: DOCTOR_A,
      });

      expect(result.slots.every((s) => !s.available)).toBe(true);
      expect(result.nextAvailableDate).toBeNull();
    });

    it('should not look beyond 14 days even if day 15 has open slots', () => {
      const appointments: TimeSlotAppointment[] = [...bookAllSlots(TARGET_DATE, DOCTOR_A)];

      // Book days 1 through 14
      for (let offset = 1; offset <= 14; offset++) {
        const d = new Date(2026, 5, 15 + offset);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        appointments.push(...bookAllSlots(`${y}-${m}-${day}`, DOCTOR_A));
      }

      // Day 15 (2026-06-30) is completely free, but beyond 14-day window
      const result = calculateTimeSlots(appointments, {
        date: TARGET_DATE,
        doctorSsn: DOCTOR_A,
      });

      expect(result.nextAvailableDate).toBeNull();
    });

    it('should consider patient conflicts when evaluating candidate day fullness in lookahead', () => {
      const appointments: TimeSlotAppointment[] = [
        ...bookAllSlots(TARGET_DATE, DOCTOR_A),
      ];

      // On 2026-06-16, Doctor A has 10 booked slots, and Patient A has appointments with Doctor B for the other 9 slots
      const candidateDate = '2026-06-16';
      DAILY_OPERATING_SLOTS.slice(0, 10).forEach((time) => {
        appointments.push({ date: candidateDate, time, doctorSsn: DOCTOR_A, patientSsn: 'OTHER' });
      });
      DAILY_OPERATING_SLOTS.slice(10).forEach((time) => {
        appointments.push({ date: candidateDate, time, doctorSsn: DOCTOR_B, patientSsn: PATIENT_A });
      });

      const result = calculateTimeSlots(appointments, {
        date: TARGET_DATE,
        doctorSsn: DOCTOR_A,
        patientSsn: PATIENT_A,
      });

      // 2026-06-16 is completely unavailable for (Doctor A + Patient A), so lookahead moves to 2026-06-17
      expect(result.nextAvailableDate).toBe('2026-06-17');
    });

    it('should correctly traverse month boundaries during lookahead', () => {
      const jan30 = '2026-01-30';
      const appointments: TimeSlotAppointment[] = [
        ...bookAllSlots(jan30, DOCTOR_A),
        ...bookAllSlots('2026-01-31', DOCTOR_A),
      ];

      const result = calculateTimeSlots(appointments, {
        date: jan30,
        doctorSsn: DOCTOR_A,
      });

      expect(result.nextAvailableDate).toBe('2026-02-01');
    });

    it('should correctly traverse year boundaries during lookahead', () => {
      const dec30 = '2026-12-30';
      const appointments: TimeSlotAppointment[] = [
        ...bookAllSlots(dec30, DOCTOR_A),
        ...bookAllSlots('2026-12-31', DOCTOR_A),
      ];

      const result = calculateTimeSlots(appointments, {
        date: dec30,
        doctorSsn: DOCTOR_A,
      });

      expect(result.nextAvailableDate).toBe('2027-01-01');
    });
  });

  describe('Edge Cases and Resilience', () => {
    it('should ignore appointments outside standard operating hours', () => {
      const appointments: TimeSlotAppointment[] = [
        { date: TARGET_DATE, time: '07:00', doctorSsn: DOCTOR_A, patientSsn: PATIENT_A },
        { date: TARGET_DATE, time: '18:00', doctorSsn: DOCTOR_A, patientSsn: PATIENT_A },
      ];

      const result = calculateTimeSlots(appointments, {
        date: TARGET_DATE,
        doctorSsn: DOCTOR_A,
      });

      expect(result.slots.every((s) => s.available)).toBe(true);
    });

    it('should handle duplicate appointments for the same slot without affecting lookahead slot count', () => {
      // 18 unique slots booked, but one slot duplicated twice (total 20 records)
      const appointments: TimeSlotAppointment[] = [
        ...DAILY_OPERATING_SLOTS.slice(0, 18).map((time) => ({
          date: TARGET_DATE,
          time,
          doctorSsn: DOCTOR_A,
          patientSsn: PATIENT_A,
        })),
        { date: TARGET_DATE, time: '08:00', doctorSsn: DOCTOR_A, patientSsn: 'OTHER' },
      ];

      const result = calculateTimeSlots(appointments, {
        date: TARGET_DATE,
        doctorSsn: DOCTOR_A,
      });

      // 17:00 is still available
      expect(result.slots.find((s) => s.time === '17:00')?.available).toBe(true);
      expect(result.nextAvailableDate).toBeNull();
    });

    it('should gracefully handle malformed date strings without throwing', () => {
      expect(() => {
        const result = calculateTimeSlots([], {
          date: 'invalid-date',
          doctorSsn: DOCTOR_A,
        });
        expect(result.slots.length).toBe(19);
        expect(result.nextAvailableDate).toBeNull();
      }).not.toThrow();
    });
  });
});
