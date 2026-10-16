import { InjectionToken, ResourceRef, Signal } from '@angular/core';
import {
  Clerk,
  Doctor,
  Patient,
  Medication,
  Treatment,
  DoctorEarnings,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  TimeSlotsResponse,
  PatientVisitsReportResponse,
  DbStatus,
} from '../models/models';

export interface TimeSlotQueryParams {
  date: string;
  doctorSsn: string;
  patientSsn?: string;
}

export type TimeSlotsResult = TimeSlotsResponse;

export interface DateRange {
  startDate: string;
  endDate: string;
}

export type ConsultationFrequencyReport = PatientVisitsReportResponse;
export type PatientVisitsReport = ConsultationFrequencyReport;

export interface DoctorEarningsReport {
  year: number;
  data: DoctorEarnings[];
}

export interface AddTreatmentResponse {
  success: boolean;
}

export class HospitalDataError extends Error {
  public override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'HospitalDataError';
    this.cause = cause;
  }
}

export class BookingConflictError extends HospitalDataError {
  constructor(message = 'Appointment time slot is no longer available.', cause?: unknown) {
    super(message, cause);
    this.name = 'BookingConflictError';
  }
}

export class PatientNotFoundError extends HospitalDataError {
  constructor(message = 'Patient could not be found.', cause?: unknown) {
    super(message, cause);
    this.name = 'PatientNotFoundError';
  }
}

export interface HospitalDataAccess {
  getDoctors(): ResourceRef<Doctor[]>;
  searchPatients(query: Signal<string> | (() => string)): ResourceRef<Patient[]>;
  getPatientDetails(
    patientId: Signal<string | number | null> | (() => string | number | null),
  ): ResourceRef<Patient | null>;
  searchClerks(query: Signal<string> | (() => string)): ResourceRef<Clerk[]>;
  getTimeSlots(
    params: Signal<TimeSlotQueryParams | undefined> | (() => TimeSlotQueryParams | undefined),
  ): ResourceRef<TimeSlotsResult | undefined>;
  getMedications(): ResourceRef<Medication[]>;
  getDoctorEarningsReport(
    year: Signal<number> | (() => number),
  ): ResourceRef<DoctorEarningsReport | undefined>;
  getConsultationFrequencyReport(
    dateRange: Signal<DateRange | undefined> | (() => DateRange | undefined),
  ): ResourceRef<ConsultationFrequencyReport | undefined>;
  getPatientVisitsReport?(
    dateRange: Signal<DateRange | undefined> | (() => DateRange | undefined),
  ): ResourceRef<PatientVisitsReport | undefined>;
  bookAppointment(payload: CreateAppointmentRequest): Promise<CreateAppointmentResponse>;
  addTreatment(
    patientId: string | number,
    appointmentId: number,
    treatment: Treatment,
  ): Promise<AddTreatmentResponse>;
  getDatabaseStatus(): ResourceRef<DbStatus | undefined>;
  seedDatabase(): Promise<{ success: boolean; message: string }>;
  migrateDatabase(): Promise<{ success: boolean; message: string }>;
}

export const HOSPITAL_DATA_ACCESS = new InjectionToken<HospitalDataAccess>('HOSPITAL_DATA_ACCESS');
