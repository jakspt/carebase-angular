import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { DoctorEarnings, Medication, Patient, Treatment } from '../models/models';
import {
  AddTreatmentResponse,
  DoctorEarningsReport,
  HOSPITAL_DATA_ACCESS,
} from './hospital-data-access';

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  private readonly hospitalDataAccess = inject(HOSPITAL_DATA_ACCESS);

  searchPatients(query: () => string) {
    return this.hospitalDataAccess.searchPatients(query);
  }

  getPatientDetails(patientId: () => string | number | null | undefined) {
    return this.hospitalDataAccess.getPatientDetails(() => {
      const id = patientId();
      return id ?? null;
    });
  }

  getMedications() {
    return this.hospitalDataAccess.getMedications();
  }

  addTreatment(
    patientId: string | number,
    appointmentId: number,
    treatment: Treatment,
  ): Observable<AddTreatmentResponse> {
    return from(this.hospitalDataAccess.addTreatment(patientId, appointmentId, treatment));
  }

  getReport(year: () => number) {
    return this.hospitalDataAccess.getDoctorEarningsReport(year);
  }
}
