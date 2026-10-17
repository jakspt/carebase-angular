import { InjectionToken, Provider, ResourceRef, Signal, Type } from '@angular/core';
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
  AppointmentResult,
} from '../../models/models';

export interface TimeSlotQueryParams {
  date: string;
  doctorSsn: string;
  patientSsn?: string;
}

export type TimeSlotsResult = TimeSlotsResponse;
export type TimeSlotResponse = TimeSlotsResponse;

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

export type DatabaseStatusResponse = DbStatus;
export interface DatabaseSeedResponse {
  success: boolean;
  message: string;
}
export interface DatabaseMigrationResponse {
  success: boolean;
  message: string;
}

export class HospitalDataError extends Error {
  public override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'HospitalDataError';
    this.cause = cause;
  }
}

export class AppointmentConflictError extends HospitalDataError {
  constructor(message = 'Appointment scheduling conflict.', cause?: unknown) {
    super(message, cause);
    this.name = 'AppointmentConflictError';
  }
}

export const BookingConflictError = AppointmentConflictError;
export type BookingConflictError = AppointmentConflictError;

export class PatientNotFoundError extends HospitalDataError {
  constructor(message = 'Patient could not be found.', cause?: unknown) {
    super(message, cause);
    this.name = 'PatientNotFoundError';
  }
}

export interface SchedulingDataAccess {
  getDoctors(): ResourceRef<Doctor[]>;
  searchPatients(query: Signal<string> | (() => string)): ResourceRef<Patient[]>;
  searchClerks(query: Signal<string> | (() => string)): ResourceRef<Clerk[]>;
  getTimeSlots(
    params: Signal<TimeSlotQueryParams | undefined> | (() => TimeSlotQueryParams | undefined),
  ): ResourceRef<TimeSlotsResult | undefined>;
  bookAppointment(payload: CreateAppointmentRequest): Promise<CreateAppointmentResponse>;
  createAppointment?: (
    request: CreateAppointmentRequest,
  ) => Promise<CreateAppointmentResponse | AppointmentResult>;
}

export interface ClinicalDataAccess {
  searchPatients(query: Signal<string> | (() => string)): ResourceRef<Patient[]>;
  getPatientDetails(
    patientId: Signal<string | number | null> | (() => string | number | null),
  ): ResourceRef<Patient | null>;
  getMedications(category?: Signal<string>): ResourceRef<Medication[]>;
  addTreatment(
    patientId: string | number,
    appointmentId: number,
    treatment: Treatment,
  ): Promise<AddTreatmentResponse>;
}

export interface ReportingDataAccess {
  getDoctorEarningsReport(
    year: Signal<number> | (() => number),
  ): ResourceRef<DoctorEarningsReport | undefined>;
  getConsultationFrequencyReport(
    dateRange: Signal<DateRange | undefined> | (() => DateRange | undefined),
  ): ResourceRef<ConsultationFrequencyReport | undefined>;
  getPatientVisitsReport?(
    dateRange: Signal<DateRange | undefined> | (() => DateRange | undefined),
  ): ResourceRef<PatientVisitsReport | undefined>;
}

export interface SystemDataAccess {
  getDatabaseStatus(): ResourceRef<DbStatus | undefined>;
  seedDatabase(): Promise<DatabaseSeedResponse>;
  migrateDatabase(): Promise<DatabaseMigrationResponse>;
}

export interface HospitalDataAccess
  extends SchedulingDataAccess,
    ClinicalDataAccess,
    ReportingDataAccess,
    SystemDataAccess {}

export const HOSPITAL_DATA_ACCESS = new InjectionToken<HospitalDataAccess>('HOSPITAL_DATA_ACCESS');
export const SCHEDULING_DATA_ACCESS = new InjectionToken<SchedulingDataAccess>('SCHEDULING_DATA_ACCESS');
export const CLINICAL_DATA_ACCESS = new InjectionToken<ClinicalDataAccess>('CLINICAL_DATA_ACCESS');
export const REPORTING_DATA_ACCESS = new InjectionToken<ReportingDataAccess>('REPORTING_DATA_ACCESS');
export const SYSTEM_DATA_ACCESS = new InjectionToken<SystemDataAccess>('SYSTEM_DATA_ACCESS');

export function provideHospitalDataAccessProviders(
  adapterType: Type<HospitalDataAccess>,
): Provider[] {
  return [
    { provide: HOSPITAL_DATA_ACCESS, useClass: adapterType },
    { provide: SCHEDULING_DATA_ACCESS, useExisting: HOSPITAL_DATA_ACCESS },
    { provide: CLINICAL_DATA_ACCESS, useExisting: HOSPITAL_DATA_ACCESS },
    { provide: REPORTING_DATA_ACCESS, useExisting: HOSPITAL_DATA_ACCESS },
    { provide: SYSTEM_DATA_ACCESS, useExisting: HOSPITAL_DATA_ACCESS },
  ];
}
