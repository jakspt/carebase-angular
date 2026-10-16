import { Doctor, DoctorEarnings } from '../models/models';
import { StoredAppointment } from './mock-hospital-data';

export interface DoctorEarningsReport {
  year: number;
  data: DoctorEarnings[];
}

/**
 * Pure domain function to aggregate total treatment costs per doctor for a target calendar year
 * from stored appointments and doctor records.
 *
 * Has zero Angular dependencies (no DI, signals, or resources) and operates strictly on plain data.
 */
export function calculateDoctorEarnings(
  doctors: readonly Doctor[],
  appointments: readonly StoredAppointment[],
  year: number,
): DoctorEarningsReport {
  const yearPrefix = String(year);

  const data: DoctorEarnings[] = doctors.map((doctor) => {
    let total = 0;
    for (const appt of appointments) {
      if (
        appt &&
        appt.doctorSsn === doctor.ssn &&
        typeof appt.date === 'string' &&
        appt.date.startsWith(yearPrefix) &&
        appt.treatment &&
        typeof appt.treatment.cost === 'number'
      ) {
        total += appt.treatment.cost;
      }
    }

    return {
      id: Number(doctor.id),
      name: doctor.name,
      specialty: doctor.specialty,
      department: doctor.department,
      year,
      totalCosts: total,
    };
  });

  return {
    year,
    data,
  };
}
