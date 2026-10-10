import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import {
  Clerk,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
} from '../models/models';
import { ActorSession } from './actor-session';
import {
  HOSPITAL_DATA_ACCESS,
  TimeSlotQueryParams,
} from './hospital-data-access';

@Injectable({
  providedIn: 'root',
})
export class ClerkService {
  private readonly actorSession = inject(ActorSession);
  private readonly hospitalDataAccess = inject(HOSPITAL_DATA_ACCESS);

  getActiveClerk() {
    return this.actorSession.activeClerk;
  }

  setActiveClerk(clerk: Clerk | null): void {
    this.actorSession.setActiveClerk(clerk);
  }

  searchClerks(query: () => string) {
    return this.hospitalDataAccess.searchClerks(query);
  }

  searchPatients(query: () => string) {
    return this.hospitalDataAccess.searchPatients(query);
  }

  getDoctors() {
    return this.hospitalDataAccess.getDoctors();
  }

  getTimeSlots(params: () => TimeSlotQueryParams | undefined) {
    return this.hospitalDataAccess.getTimeSlots(params);
  }

  bookAppointment(payload: CreateAppointmentRequest): Observable<CreateAppointmentResponse> {
    return from(this.hospitalDataAccess.bookAppointment(payload));
  }

  getPatientVisitsReport(dateRange: () => { startDate: string; endDate: string } | undefined) {
    return this.hospitalDataAccess.getPatientVisitsReport(dateRange);
  }
}
