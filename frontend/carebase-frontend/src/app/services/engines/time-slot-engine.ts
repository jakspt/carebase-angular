import { TimeSlot, TimeSlotsResponse } from '../../models/models';

export interface TimeSlotAppointment {
  date: string;
  time: string;
  doctorSsn: string;
  patientSsn: string;
}

export interface TimeSlotQueryParams {
  date: string;
  doctorSsn: string;
  patientSsn?: string;
}

export type TimeSlotsResult = TimeSlotsResponse;

export const OPERATING_HOURS_START = 8;
export const OPERATING_HOURS_END = 17;
export const LOOKAHEAD_WINDOW_DAYS = 14;

export const DAILY_OPERATING_SLOTS: readonly string[] = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
];

export const SLOTS_PER_DAY = DAILY_OPERATING_SLOTS.length; // 19

function isSlotConflict(
  appt: TimeSlotAppointment,
  doctorSsn: string,
  patientSsn?: string,
): boolean {
  return appt.doctorSsn === doctorSsn || Boolean(patientSsn && appt.patientSsn === patientSsn);
}

/**
 * Calculates available 30-minute time slots for a given doctor and date,
 * filtering out any doctor or patient scheduling conflicts.
 *
 * If all 19 daily slots (08:00 - 17:00) are booked, computes the next available
 * date within a 14-day forward lookahead window.
 *
 * Has zero Angular dependencies and operates strictly on plain data.
 */
export function calculateTimeSlots(
  appointments: readonly TimeSlotAppointment[],
  params: TimeSlotQueryParams,
): TimeSlotsResult {
  const rawDate = (params.date ?? '').split('T')[0];
  const unavailableSlots = new Set<string>();

  for (const a of appointments) {
    if (!a?.date || !a?.time) continue;
    const apptDate = a.date.split('T')[0];
    if (apptDate === rawDate && isSlotConflict(a, params.doctorSsn, params.patientSsn)) {
      unavailableSlots.add(a.time);
    }
  }

  const slots: TimeSlot[] = DAILY_OPERATING_SLOTS.map((timeStr) => ({
    time: timeStr,
    available: !unavailableSlots.has(timeStr),
  }));

  let nextAvailableDate: string | null = null;
  const hasAvailable = slots.some((s) => s.available);

  if (!hasAvailable && rawDate) {
    try {
      const parts = rawDate.split('-');
      if (parts.length === 3) {
        const curr = new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10),
        );
        if (!isNaN(curr.getTime())) {
          for (let offset = 1; offset <= LOOKAHEAD_WINDOW_DAYS; offset++) {
            const candidate = new Date(curr);
            candidate.setDate(curr.getDate() + offset);
            const year = candidate.getFullYear();
            const month = String(candidate.getMonth() + 1).padStart(2, '0');
            const day = String(candidate.getDate()).padStart(2, '0');
            const candidateStr = `${year}-${month}-${day}`;

            const unavailableOnCandidate = new Set<string>();
            for (const a of appointments) {
              if (!a?.date || !a?.time) continue;
              const apptDate = a.date.split('T')[0];
              if (
                apptDate === candidateStr &&
                isSlotConflict(a, params.doctorSsn, params.patientSsn) &&
                DAILY_OPERATING_SLOTS.includes(a.time)
              ) {
                unavailableOnCandidate.add(a.time);
              }
            }

            if (unavailableOnCandidate.size < SLOTS_PER_DAY) {
              nextAvailableDate = candidateStr;
              break;
            }
          }
        }
      }
    } catch {
      // ignore date parse issues
    }
  }

  return {
    date: rawDate,
    doctorSsn: params.doctorSsn,
    patientSsn: params.patientSsn,
    slots,
    nextAvailableDate,
  };
}

export const calculateSlots = calculateTimeSlots;
