export * from './engines';
export * from './data-access';
export * from './actor-session';
export * from './operation-runner';

// Explicit re-exports for types defined compatibly in both sub-domains to prevent ambiguity
export type {
  DateRange,
  ConsultationFrequencyReport,
  DoctorEarningsReport,
  TimeSlotQueryParams,
  TimeSlotsResult,
  TimeSlotResponse,
  SchedulingDataAccess,
  ClinicalDataAccess,
  ReportingDataAccess,
  SystemDataAccess,
  DatabaseStatusResponse,
  DatabaseSeedResponse,
  DatabaseMigrationResponse,
  ClinicalHistoryItem,
  TreatmentRecordRequest,
  TreatmentRecordResult,
} from './data-access';
