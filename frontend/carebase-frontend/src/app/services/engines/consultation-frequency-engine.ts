import { Doctor, Patient, PatientVisitRecord, PatientVisitsReportResponse } from '../../models/models';
import { StoredAppointment } from '../data-access/mock-hospital-data';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export type ConsultationFrequencyReport = PatientVisitsReportResponse;

/**
 * Pure domain function to aggregate consultation visit counts per patient-doctor pair
 * within a date range from stored appointments, patient records, and doctor records.
 *
 * Has zero Angular dependencies (no DI, signals, or resources) and operates strictly on plain data.
 */
export function calculateConsultationFrequency(
  appointments: readonly StoredAppointment[],
  patients: readonly Patient[],
  doctors: readonly Doctor[],
  range: DateRange,
): ConsultationFrequencyReport {
  if (!range || !range.startDate || !range.endDate || range.startDate > range.endDate) {
    return {
      startDate: range?.startDate ?? '',
      endDate: range?.endDate ?? '',
      results: [],
    };
  }

  const counts = new Map<string, { patientSsn: string; doctorSsn: string; count: number }>();

  for (const appt of appointments) {
    if (!appt || !appt.date || !appt.patientSsn || !appt.doctorSsn) {
      continue;
    }

    const apptDate = appt.date.split('T')[0];
    if (apptDate >= range.startDate && apptDate <= range.endDate) {
      const key = `${appt.patientSsn}_${appt.doctorSsn}`;
      const existing = counts.get(key);
      if (existing) {
        existing.count++;
      } else {
        counts.set(key, {
          patientSsn: appt.patientSsn,
          doctorSsn: appt.doctorSsn,
          count: 1,
        });
      }
    }
  }

  const results: PatientVisitRecord[] = Array.from(counts.values()).map((item) => {
    const patient = patients.find(
      (p) => p && (p.ssn === item.patientSsn || String(p.id) === item.patientSsn),
    );
    const doctor = doctors.find(
      (d) => d && (d.ssn === item.doctorSsn || String(d.id) === item.doctorSsn),
    );

    return {
      patientSsn: item.patientSsn,
      patientName: patient?.name ?? 'Unknown Patient',
      insurance: patient?.insurance ?? '',
      doctorSsn: item.doctorSsn,
      doctorName: doctor?.name ?? 'Unknown Doctor',
      specialty: doctor?.specialty ?? '',
      department: doctor?.department ?? '',
      visitCount: item.count,
    };
  });

  return {
    startDate: range.startDate,
    endDate: range.endDate,
    results,
  };
}
