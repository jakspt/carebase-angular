export interface Appointment {
  id: number;
  date: string;
  time: string;
  doctorName: string;
  reason: string;
}

export interface Patient {
  id: string | number;
  name: string;
  ssn: string;
  insurance: string;
  nacaScore?: number;
  appointments?: Appointment[];
}

export interface Clerk {
  id: string;
  name: string;
  ssn: string;
}

export interface Doctor {
  id: string;
  name: string;
  ssn: string;
  specialty: string;
  position: string;
  department: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface TimeSlotsResponse {
  date: string;
  doctorSsn: string;
  patientSsn?: string;
  slots: TimeSlot[];
  nextAvailableDate?: string | null;
}

export interface CreateAppointmentRequest {
  patientSsn: string;
  doctorSsn: string;
  date: string;
  time: string;
  reason?: string;
  clerkSsn?: string;
}

export interface CreateAppointmentResponse {
  success: boolean;
  appointmentId?: number;
  message?: string;
  appointment?: {
    patientSsn: string;
    doctorSsn: string;
    date: string;
    time: string;
    reason?: string;
  };
  error?: string;
}

export interface AppointmentNotes {
  reason: string;
}

export type AppointmentResult =
  | { status: 'success'; appointmentId?: number }
  | { status: 'conflict' }
  | { status: 'validation_error'; message: string }
  | { status: 'error'; message: string };

export type BookingResult = AppointmentResult;

export interface PatientVisitRecord {
  patientSsn: string;
  patientName: string;
  insurance: string;
  doctorSsn: string;
  doctorName: string;
  specialty: string;
  department: string;
  visitCount: number;
}

export interface PatientVisitsReportResponse {
  startDate: string;
  endDate: string;
  results: PatientVisitRecord[];
}

export interface Medication {
  id: number;
  name: string;
}

export interface Treatment {
  description: string;
  cost: number;
  medications: Medication[];
}

export interface DoctorEarnings {
  id: number;
  name: string;
  specialty: string;
  department: string;
  year: number;
  totalCosts: number;
}

export interface DbStatus {
  dbType: 'MariaDB' | 'MongoDB';
}
