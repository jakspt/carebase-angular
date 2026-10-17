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
} from './data-access';
