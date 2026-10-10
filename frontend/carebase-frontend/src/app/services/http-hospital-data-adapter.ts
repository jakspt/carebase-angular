import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, Injector, ResourceRef, Signal, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  Clerk,
  Doctor,
  Patient,
  Medication,
  Treatment,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
} from '../models/models';
import {
  AddTreatmentResponse,
  BookingConflictError,
  DateRange,
  DoctorEarningsReport,
  HospitalDataAccess,
  HospitalDataError,
  PatientVisitsReport,
  TimeSlotQueryParams,
  TimeSlotsResult,
} from './hospital-data-access';

@Injectable({
  providedIn: 'root',
})
export class HttpHospitalDataAdapter implements HospitalDataAccess {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);

  getDoctors(): ResourceRef<Doctor[]> {
    return httpResource<Doctor[]>(() => '/api/clerk/doctors', {
      injector: this.injector,
      defaultValue: [],
      parse: (raw: unknown) => (raw as { doctors?: Doctor[] })?.doctors ?? [],
    });
  }

  searchPatients(query: Signal<string> | (() => string)): ResourceRef<Patient[]> {
    return httpResource<Patient[]>(
      () => {
        const q = typeof query === 'function' ? query()?.trim() : '';
        if (!q || q.length < 2) return undefined;
        return `/api/clerk/patients/search?q=${encodeURIComponent(q)}`;
      },
      {
        injector: this.injector,
        defaultValue: [],
        parse: (raw: unknown) => (raw as { patients?: Patient[] })?.patients ?? [],
      },
    );
  }

  getPatientDetails(
    patientId: Signal<string | number | null> | (() => string | number | null),
  ): ResourceRef<Patient | null> {
    return httpResource<Patient | null>(
      () => {
        const id = typeof patientId === 'function' ? patientId() : null;
        if (!id) return undefined;
        return `/api/doctor/patients/${encodeURIComponent(String(id))}`;
      },
      {
        injector: this.injector,
        defaultValue: null,
        parse: (raw: unknown) => (raw as Patient) ?? null,
      },
    );
  }

  searchClerks(query: Signal<string> | (() => string)): ResourceRef<Clerk[]> {
    return httpResource<Clerk[]>(
      () => {
        const q = typeof query === 'function' ? query()?.trim() ?? '' : '';
        return `/api/clerk/clerks/search?q=${encodeURIComponent(q)}`;
      },
      {
        injector: this.injector,
        defaultValue: [],
        parse: (raw: unknown) => (raw as { clerks?: Clerk[] })?.clerks ?? [],
      },
    );
  }

  getTimeSlots(
    params: Signal<TimeSlotQueryParams | undefined> | (() => TimeSlotQueryParams | undefined),
  ): ResourceRef<TimeSlotsResult | undefined> {
    return httpResource<TimeSlotsResult>(
      () => {
        const p = typeof params === 'function' ? params() : undefined;
        if (!p || !p.date || !p.doctorSsn) return undefined;
        let url = `/api/clerk/time-slots?date=${encodeURIComponent(p.date)}&doctorSsn=${encodeURIComponent(p.doctorSsn)}`;
        if (p.patientSsn) {
          url += `&patientSsn=${encodeURIComponent(p.patientSsn)}`;
        }
        return url;
      },
      {
        injector: this.injector,
      },
    );
  }

  getMedications(): ResourceRef<Medication[]> {
    return httpResource<Medication[]>(
      () => '/api/doctor/medications',
      {
        injector: this.injector,
        defaultValue: [],
        parse: (raw: unknown) => (raw as { medications?: Medication[] })?.medications ?? [],
      },
    );
  }

  getDoctorEarningsReport(
    year: Signal<number> | (() => number),
  ): ResourceRef<DoctorEarningsReport | undefined> {
    return httpResource<DoctorEarningsReport>(
      () => {
        const y = typeof year === 'function' ? year() : undefined;
        if (y === undefined) return undefined;
        return `/api/doctor/report?year=${encodeURIComponent(String(y))}`;
      },
      {
        injector: this.injector,
      },
    );
  }

  getPatientVisitsReport(
    dateRange: Signal<DateRange | undefined> | (() => DateRange | undefined),
  ): ResourceRef<PatientVisitsReport | undefined> {
    return httpResource<PatientVisitsReport>(
      () => {
        const range = typeof dateRange === 'function' ? dateRange() : undefined;
        if (!range || !range.startDate || !range.endDate) return undefined;
        return `/api/clerk/reports/patient-visits?startDate=${encodeURIComponent(range.startDate)}&endDate=${encodeURIComponent(range.endDate)}`;
      },
      {
        injector: this.injector,
      },
    );
  }

  async bookAppointment(payload: CreateAppointmentRequest): Promise<CreateAppointmentResponse> {
    try {
      return await firstValueFrom(
        this.http.post<CreateAppointmentResponse>('/api/clerk/appointments', payload),
      );
    } catch (err: unknown) {
      const httpErr = err as { status?: number; error?: { error?: string }; message?: string };
      if (httpErr?.status === 409) {
        throw new BookingConflictError(
          httpErr.error?.error || 'Appointment time slot is no longer available.',
          err,
        );
      }
      throw new HospitalDataError(
        httpErr?.error?.error || httpErr?.message || 'Failed to book appointment.',
        err,
      );
    }
  }

  async addTreatment(
    patientId: string | number,
    appointmentId: number,
    treatment: Treatment,
  ): Promise<AddTreatmentResponse> {
    try {
      return await firstValueFrom(
        this.http.post<AddTreatmentResponse>(
          `/api/doctor/patients/${encodeURIComponent(String(patientId))}/appointments/${encodeURIComponent(String(appointmentId))}/treatments`,
          treatment,
        ),
      );
    } catch (err: unknown) {
      const httpErr = err as { error?: { error?: string }; message?: string };
      throw new HospitalDataError(
        httpErr?.error?.error || httpErr?.message || 'Failed to add treatment.',
        err,
      );
    }
  }
}
