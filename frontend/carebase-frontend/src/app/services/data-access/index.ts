export * from './hospital-data-access';
export * from './http-hospital-data-adapter';
export * from './in-memory-hospital-data-adapter';
export * from './mock-hospital-data';
export type { StoredAppointment, HospitalFixtureData } from './mock-hospital-data';
export type {
  SchedulingDataAccess,
  ClinicalDataAccess,
  ReportingDataAccess,
  SystemDataAccess,
  TimeSlotResponse,
  DatabaseStatusResponse,
  DatabaseSeedResponse,
  DatabaseMigrationResponse,
  ClinicalHistoryItem,
  TreatmentRecordRequest,
  TreatmentRecordResult,
} from './hospital-data-access';
