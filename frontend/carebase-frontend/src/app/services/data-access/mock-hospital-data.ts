import { Clerk, Doctor, Medication, Patient, Treatment } from '../../models/models';

export interface StoredAppointment {
  id: number;
  date: string;
  time: string;
  doctorSsn: string;
  patientSsn: string;
  reason?: string;
  clerkSsn?: string;
  treatment?: Treatment;
}

export interface HospitalFixtureData {
  doctors: Doctor[];
  clerks: Clerk[];
  patients: Patient[];
  medications: Medication[];
  appointments: StoredAppointment[];
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function offsetDays(base: Date, days: number): string {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  return toIsoDate(d);
}

function getPastDateInCurrentYear(base: Date, daysAgo: number): string {
  const target = new Date(base.getFullYear(), base.getMonth(), base.getDate() - daysAgo);
  // Guarantee date stays within the current calendar year for annual report default filters
  if (target.getFullYear() < base.getFullYear()) {
    const day = Math.min(Math.max(1, (daysAgo % 27) + 1), 28);
    return toIsoDate(new Date(base.getFullYear(), 0, day));
  }
  return toIsoDate(target);
}

/**
 * Minimal baseline fixtures preserving the exact entities and 2026 dates
 * expected by existing Vitest test suites (e.g. clerk-report.spec.ts, doctor-report.spec.ts).
 */
export function createMinimalHospitalData(): HospitalFixtureData {
  const doctors: Doctor[] = [
    {
      id: '3001',
      name: 'Dr. Alexander Weber',
      ssn: '3001',
      specialty: 'Cardiology',
      position: 'Chief of Department',
      department: 'Cardiology',
    },
    {
      id: '3002',
      name: 'Dr. Sarah Jenkins',
      ssn: '3002',
      specialty: 'Neurology',
      position: 'Attending',
      department: 'Neurology',
    },
    {
      id: '3003',
      name: 'Dr. Michael Chen',
      ssn: '3003',
      specialty: 'Orthopedics',
      position: 'Senior Resident',
      department: 'Orthopedics',
    },
  ];

  const clerks: Clerk[] = [
    { id: '1001', name: 'Erika Mustermann', ssn: '1001' },
    { id: '1002', name: 'Max Mustermann', ssn: '1002' },
  ];

  const patients: Patient[] = [
    {
      id: '2001',
      name: 'Maria Gruber',
      ssn: '2001',
      insurance: 'ÖGK',
      nacaScore: 1,
      appointments: [
        {
          id: 101,
          date: '2026-09-10',
          time: '09:00',
          doctorName: 'Dr. Alexander Weber',
          reason: 'Initial consultation',
        },
      ],
    },
    {
      id: '2002',
      name: 'Johann Schmidt',
      ssn: '2002',
      insurance: 'BVAEB',
      nacaScore: 2,
      appointments: [],
    },
    {
      id: '2003',
      name: 'Anna Fischer',
      ssn: '2003',
      insurance: 'SVS',
      nacaScore: 0,
      appointments: [],
    },
  ];

  const medications: Medication[] = [
    { id: 1, name: 'Aspirin' },
    { id: 2, name: 'Paracetamol' },
    { id: 3, name: 'Ibuprofen' },
    { id: 4, name: 'Amoxicillin' },
    { id: 5, name: 'Metformin' },
  ];

  const appointments: StoredAppointment[] = [
    {
      id: 101,
      date: '2026-09-10',
      time: '09:00',
      doctorSsn: '3001',
      patientSsn: '2001',
      reason: 'Initial consultation',
      treatment: {
        description: 'Echocardiogram',
        cost: 250,
        medications: [{ id: 1, name: 'Aspirin' }],
      },
    },
    {
      id: 102,
      date: '2026-10-15',
      time: '09:00',
      doctorSsn: '3001',
      patientSsn: '2002',
      reason: 'Routine checkup',
    },
  ];

  return { doctors, clerks, patients, medications, appointments };
}

/**
 * Dynamic demo fixtures with expanded domain breadth across 6 departments,
 * high-affinity autocomplete search terms, and dates anchored relative to "now".
 */
export function createDemoHospitalData(referenceDate: Date = new Date()): HospitalFixtureData {
  const doctors: Doctor[] = [
    {
      id: '3001',
      name: 'Dr. Alexander Weber',
      ssn: '3001',
      specialty: 'Cardiology',
      position: 'Chief of Department',
      department: 'Cardiology',
    },
    {
      id: '3002',
      name: 'Dr. Sarah Jenkins',
      ssn: '3002',
      specialty: 'Neurology',
      position: 'Attending',
      department: 'Neurology',
    },
    {
      id: '3003',
      name: 'Dr. Michael Chen',
      ssn: '3003',
      specialty: 'Orthopedics',
      position: 'Senior Resident',
      department: 'Orthopedics',
    },
    {
      id: '3004',
      name: 'Dr. Thomas Bergmann',
      ssn: '3004',
      specialty: 'Internal Medicine',
      position: 'Chief of Department',
      department: 'Internal Medicine',
    },
    {
      id: '3005',
      name: 'Dr. Lisa Sommer',
      ssn: '3005',
      specialty: 'Pediatrics',
      position: 'Attending',
      department: 'Pediatrics',
    },
    {
      id: '3006',
      name: 'Dr. Felix Steiner',
      ssn: '3006',
      specialty: 'Dermatology',
      position: 'Resident',
      department: 'Dermatology',
    },
  ];

  const clerks: Clerk[] = [
    { id: '1001', name: 'Erika Mustermann', ssn: '1001' },
    { id: '1002', name: 'Max Mustermann', ssn: '1002' },
    { id: '1003', name: 'Sophie Wagner', ssn: '1003' },
  ];

  const medications: Medication[] = [
    { id: 1, name: 'Aspirin' },
    { id: 2, name: 'Paracetamol' },
    { id: 3, name: 'Ibuprofen' },
    { id: 4, name: 'Amoxicillin' },
    { id: 5, name: 'Metformin' },
    { id: 6, name: 'Pantoprazol' },
    { id: 7, name: 'Lisinopril' },
    { id: 8, name: 'Simvastatin' },
  ];

  const today = offsetDays(referenceDate, 0);
  const tomorrow = offsetDays(referenceDate, 1);
  const in3Days = offsetDays(referenceDate, 3);
  const past2Days = getPastDateInCurrentYear(referenceDate, 2);
  const past5Days = getPastDateInCurrentYear(referenceDate, 5);
  const past12Days = getPastDateInCurrentYear(referenceDate, 12);
  const past25Days = getPastDateInCurrentYear(referenceDate, 25);
  const past45Days = getPastDateInCurrentYear(referenceDate, 45);
  const past70Days = getPastDateInCurrentYear(referenceDate, 70);
  const past100Days = getPastDateInCurrentYear(referenceDate, 100);
  const past140Days = getPastDateInCurrentYear(referenceDate, 140);
  const past180Days = getPastDateInCurrentYear(referenceDate, 180);

  const appointments: StoredAppointment[] = [
    // Today: Dr. Weber booked at 09:00
    {
      id: 101,
      date: today,
      time: '09:00',
      doctorSsn: '3001',
      patientSsn: '2001',
      reason: 'Cardiology routine checkup',
      clerkSsn: '1001',
    },
    // Today: Dr. Chen booked at 14:00
    {
      id: 102,
      date: today,
      time: '14:00',
      doctorSsn: '3003',
      patientSsn: '2004',
      reason: 'Orthopedic consultation',
      clerkSsn: '1002',
    },
    // Tomorrow: Dr. Jenkins booked at 10:30
    {
      id: 103,
      date: tomorrow,
      time: '10:30',
      doctorSsn: '3002',
      patientSsn: '2002',
      reason: 'Neurology follow-up',
      clerkSsn: '1003',
    },
    // In 3 Days: Dr. Sommer booked at 11:00
    {
      id: 104,
      date: in3Days,
      time: '11:00',
      doctorSsn: '3005',
      patientSsn: '2005',
      reason: 'Pediatric wellness exam',
      clerkSsn: '1001',
    },
    // Past 2 Days: Dr. Weber with recorded Treatment
    {
      id: 105,
      date: past2Days,
      time: '11:00',
      doctorSsn: '3001',
      patientSsn: '2001',
      reason: 'Echocardiogram and ECG',
      clerkSsn: '1001',
      treatment: {
        description: 'Transthoracic echocardiogram and resting ECG',
        cost: 320,
        medications: [
          { id: 1, name: 'Aspirin' },
          { id: 7, name: 'Lisinopril' },
        ],
      },
    },
    // Past 5 Days: Dr. Bergmann with NO treatment (ready for Doctor usecase treatment entry)
    {
      id: 106,
      date: past5Days,
      time: '09:30',
      doctorSsn: '3004',
      patientSsn: '2006',
      reason: 'General internal medicine review',
      clerkSsn: '1002',
    },
    // Past 12 Days: Dr. Steiner with recorded Treatment
    {
      id: 107,
      date: past12Days,
      time: '15:00',
      doctorSsn: '3006',
      patientSsn: '2003',
      reason: 'Dermatological screening',
      clerkSsn: '1003',
      treatment: {
        description: 'Skin lesion excision and pathology biopsy',
        cost: 210,
        medications: [{ id: 3, name: 'Ibuprofen' }],
      },
    },
    // Earlier this year: Dr. Jenkins with recorded Treatment
    {
      id: 108,
      date: past25Days,
      time: '14:30',
      doctorSsn: '3002',
      patientSsn: '2002',
      reason: 'Electroencephalography evaluation',
      clerkSsn: '1001',
      treatment: {
        description: 'Standard 30-channel EEG diagnostics',
        cost: 480,
        medications: [],
      },
    },
    // Earlier this year: Dr. Chen with recorded Treatment
    {
      id: 109,
      date: past45Days,
      time: '10:00',
      doctorSsn: '3003',
      patientSsn: '2004',
      reason: 'Post-operative knee follow-up',
      clerkSsn: '1002',
      treatment: {
        description: 'Intra-articular hyaluronic injection and mobilization',
        cost: 390,
        medications: [{ id: 2, name: 'Paracetamol' }],
      },
    },
    // Earlier this year: Dr. Bergmann with recorded Treatment
    {
      id: 110,
      date: past70Days,
      time: '08:30',
      doctorSsn: '3004',
      patientSsn: '2005',
      reason: 'Hypertension and metabolic workup',
      clerkSsn: '1003',
      treatment: {
        description: '24-hour ambulatory blood pressure and lipid panel',
        cost: 175,
        medications: [
          { id: 6, name: 'Pantoprazol' },
          { id: 7, name: 'Lisinopril' },
        ],
      },
    },
    // Earlier this year: Dr. Sommer with recorded Treatment
    {
      id: 111,
      date: past100Days,
      time: '13:00',
      doctorSsn: '3005',
      patientSsn: '2006',
      reason: 'Childhood allergy testing',
      clerkSsn: '1001',
      treatment: {
        description: 'Inhalation allergen skin prick test series',
        cost: 145,
        medications: [],
      },
    },
    // Earlier this year: Dr. Weber with recorded Treatment
    {
      id: 112,
      date: past140Days,
      time: '09:00',
      doctorSsn: '3001',
      patientSsn: '2003',
      reason: 'Cardiac ergometry stress test',
      clerkSsn: '1002',
      treatment: {
        description: 'Bicycle ergometry stress test and VO2 estimation',
        cost: 260,
        medications: [
          { id: 1, name: 'Aspirin' },
          { id: 8, name: 'Simvastatin' },
        ],
      },
    },
    // Earlier this year: Dr. Jenkins with recorded Treatment
    {
      id: 113,
      date: past180Days,
      time: '16:00',
      doctorSsn: '3002',
      patientSsn: '2001',
      reason: 'Chronic migraine therapeutic adjustment',
      clerkSsn: '1003',
      treatment: {
        description: 'Neurological headache protocol assessment',
        cost: 190,
        medications: [{ id: 3, name: 'Ibuprofen' }],
      },
    },
  ];

  // Map doctor SSN to Doctor Name for patient appointment histories
  const doctorNameMap = new Map<string, string>(doctors.map((d) => [d.ssn, d.name]));

  const rawPatients: Omit<Patient, 'appointments'>[] = [
    { id: '2001', name: 'Maria Gruber', ssn: '2001', insurance: 'ÖGK', nacaScore: 1 },
    { id: '2002', name: 'Johann Schmidt', ssn: '2002', insurance: 'BVAEB', nacaScore: 2 },
    { id: '2003', name: 'Anna Fischer', ssn: '2003', insurance: 'SVS', nacaScore: 0 },
    { id: '2004', name: 'Stefan Wagner', ssn: '2004', insurance: 'ÖGK', nacaScore: 3 },
    { id: '2005', name: 'Elena Bauer', ssn: '2005', insurance: 'BVAEB', nacaScore: 5 },
    { id: '2006', name: 'Markus Huber', ssn: '2006', insurance: 'SVS', nacaScore: 1 },
  ];

  const patients: Patient[] = rawPatients.map((p) => {
    const patientAppointments = appointments
      .filter((a) => a.patientSsn === p.ssn)
      .map((a) => ({
        id: a.id,
        date: a.date,
        time: a.time,
        doctorName: doctorNameMap.get(a.doctorSsn) ?? 'Attending Doctor',
        reason: a.reason ?? '',
      }));
    return {
      ...p,
      appointments: patientAppointments,
    };
  });

  return { doctors, clerks, patients, medications, appointments };
}
