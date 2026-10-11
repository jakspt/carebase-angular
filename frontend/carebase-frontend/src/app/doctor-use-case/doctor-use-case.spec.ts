import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DoctorUseCase } from './doctor-use-case';
import { HOSPITAL_DATA_ACCESS } from '../services/hospital-data-access';
import { InMemoryHospitalDataAdapter } from '../services/in-memory-hospital-data-adapter';

describe('DoctorUseCase', () => {
  let component: DoctorUseCase;
  let fixture: ComponentFixture<DoctorUseCase>;
  let dataAdapter: InMemoryHospitalDataAdapter;

  const settle = () => new Promise((r) => setTimeout(r, 20));

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [DoctorUseCase],
      providers: [{ provide: HOSPITAL_DATA_ACCESS, useClass: InMemoryHospitalDataAdapter }],
    });

    fixture = TestBed.createComponent(DoctorUseCase);
    component = fixture.componentInstance;
    dataAdapter = TestBed.inject(HOSPITAL_DATA_ACCESS) as InMemoryHospitalDataAdapter;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should search patients and resolve unwrapped records via InMemoryHospitalDataAdapter', async () => {
    component.searchQuery.set('Maria');
    await settle();
    await fixture.whenStable();

    expect(component.patients().length).toBeGreaterThan(0);
    expect(component.patients()[0].name).toContain('Maria');
  });

  it('should load medications formulary directly into filteredMedications', async () => {
    await settle();
    await fixture.whenStable();

    expect(component.filteredMedications().length).toBeGreaterThan(0);
    expect(component.filteredMedications()[0]).toHaveProperty('name');
  });

  it('should record treatment against selected patient and appointment', async () => {
    // Select patient and appointment
    component.selectedPatient.set({
      id: '2001',
      name: 'Maria Gruber',
      ssn: '2001',
      insurance: 'ÖGK',
    });
    component.selectedAppointment.set({
      id: 101,
      date: '2026-09-10',
      time: '09:00',
      doctorName: 'Dr. Alexander Weber',
      reason: 'Initial consultation',
    });

    component.treatmentModel.set({
      description: 'Follow-up prescription',
      cost: 150,
      medications: [{ id: 1, name: 'Aspirin' }],
    });

    const mockStepper: any = { next: vi.fn() };
    component.onSubmitTreatment(mockStepper);
    await settle();
    await fixture.whenStable();

    expect(component.treatmentCompleted()).toBe(true);
  });
});
