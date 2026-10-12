import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSnackBarHarness } from '@angular/material/snack-bar/testing';
import { By } from '@angular/platform-browser';
import { MatStepper } from '@angular/material/stepper';
import { DoctorUseCase } from './doctor-use-case';
import { HOSPITAL_DATA_ACCESS } from '../services/hospital-data-access';
import {
  InMemoryHospitalDataAdapter,
  provideTestHospitalData,
} from '../services/in-memory-hospital-data-adapter';
import { Appointment, Patient } from '../models/models';

describe('DoctorUseCase', () => {
  let component: DoctorUseCase;
  let fixture: ComponentFixture<DoctorUseCase>;
  let dataAdapter: InMemoryHospitalDataAdapter;
  let stepper: MatStepper;

  const samplePatient: Patient = {
    id: '2001',
    name: 'Maria Gruber',
    ssn: '2001',
    insurance: 'ÖGK',
  };

  const sampleAppointment: Appointment = {
    id: 101,
    date: '2026-09-10',
    time: '09:00',
    doctorName: 'Dr. Alexander Weber',
    reason: 'Initial consultation',
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [DoctorUseCase],
      providers: [provideNoopAnimations(), provideTestHospitalData()],
    });

    fixture = TestBed.createComponent(DoctorUseCase);
    component = fixture.componentInstance;
    dataAdapter = TestBed.inject(HOSPITAL_DATA_ACCESS) as InMemoryHospitalDataAdapter;
    await fixture.whenStable();

    const stepperDebug = fixture.debugElement.query(By.directive(MatStepper));
    stepper = stepperDebug.componentInstance as MatStepper;
  });

  it('should create and initialize with default unselected state', () => {
    expect(component).toBeTruthy();
    expect(component.selectedPatient()).toBeNull();
    expect(component.selectedAppointment()).toBeNull();
    expect(component.treatmentCompleted()).toBe(false);
    expect(stepper.selectedIndex).toBe(0);
  });

  it('should search patients and resolve records via InMemoryHospitalDataAdapter', async () => {
    component.searchQuery.set('Maria');
    await fixture.whenStable();

    await vi.waitFor(() => {
      expect(component.patients().length).toBeGreaterThan(0);
    });

    expect(component.patients()[0].name).toContain('Maria');
    expect(component.patients()[0].ssn).toBe('2001');
  });

  it('should advance stepper to appointment selection when a patient is selected and Next is clicked', async () => {
    component.searchQuery.set('Maria');
    await vi.waitFor(() => {
      expect(component.patients().length).toBeGreaterThan(0);
    });

    const patient = component.patients()[0];
    component.onPatientSelected(patient, stepper);
    await fixture.whenStable();

    // Click Next button on the selected patient card
    const nextBtn = fixture.nativeElement.querySelector('.selected-entity-card button');
    nextBtn.click();
    await fixture.whenStable();

    expect(component.selectedPatient()).toEqual(patient);
    expect(stepper.selectedIndex).toBe(1);

    await vi.waitFor(() => {
      expect(component.appointments().length).toBeGreaterThan(0);
    });
    expect(component.appointments()[0].id).toBe(101);
  });

  it('should advance stepper to treatment form when an appointment is selected and Next is clicked', async () => {
    component.searchQuery.set('Maria');
    await vi.waitFor(() => {
      expect(component.patients().length).toBeGreaterThan(0);
    });

    const patient = component.patients()[0];
    component.onPatientSelected(patient, stepper);
    await fixture.whenStable();

    const nextBtn1 = fixture.nativeElement.querySelector('.selected-entity-card button');
    nextBtn1.click();
    await fixture.whenStable();

    await vi.waitFor(() => {
      expect(component.appointments().length).toBeGreaterThan(0);
    });

    const appointment = component.appointments()[0];
    component.onSelectAppointment(appointment, stepper);
    await fixture.whenStable();

    const nextBtn2 = fixture.nativeElement.querySelectorAll('.step-actions button')[1];
    nextBtn2.click();
    await fixture.whenStable();

    expect(component.selectedAppointment()).toEqual(appointment);
    expect(stepper.selectedIndex).toBe(2);
  });

  it('should load medications formulary and manage medication list additions and removals', async () => {
    await vi.waitFor(() => {
      expect(component.filteredMedications().length).toBeGreaterThan(0);
    });

    const aspirin = component.filteredMedications().find((m) => m.name === 'Aspirin')!;
    expect(aspirin).toBeDefined();

    component.addMedication(aspirin);
    expect(component.treatmentModel().medications).toContainEqual(aspirin);

    // Filtered medications should now exclude the added medication
    expect(component.filteredMedications().some((m) => m.id === aspirin.id)).toBe(false);

    component.removeMedication(aspirin);
    expect(component.treatmentModel().medications).not.toContainEqual(aspirin);
    expect(component.filteredMedications().some((m) => m.id === aspirin.id)).toBe(true);
  });

  it('should record treatment and prescribed medications through complete workflow without mock steppers', async () => {
    const rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);

    // Step 1: Search and select patient
    component.searchQuery.set('Maria');
    await vi.waitFor(() => {
      expect(component.patients().length).toBeGreaterThan(0);
    });
    const patient = component.patients()[0];
    component.onPatientSelected(patient, stepper);
    await fixture.whenStable();

    const nextBtn1 = fixture.nativeElement.querySelector('.selected-entity-card button');
    nextBtn1.click();
    await fixture.whenStable();
    expect(stepper.selectedIndex).toBe(1);

    // Step 2: Select appointment
    await vi.waitFor(() => {
      expect(component.appointments().length).toBeGreaterThan(0);
    });
    const appointment = component.appointments()[0];
    component.onSelectAppointment(appointment, stepper);
    await fixture.whenStable();

    const nextBtn2 = fixture.nativeElement.querySelectorAll('.step-actions button')[1];
    nextBtn2.click();
    await fixture.whenStable();
    expect(stepper.selectedIndex).toBe(2);

    // Step 3: Populate treatment details and prescribe medication
    await vi.waitFor(() => {
      expect(component.filteredMedications().length).toBeGreaterThan(0);
    });
    const med = component.filteredMedications()[0];
    component.addMedication(med);

    component.treatmentModel.update((model) => ({
      ...model,
      description: 'Prescribed follow-up regimen and advised rest.',
      cost: 180,
    }));
    await fixture.whenStable();

    // Submit treatment through component workflow
    await component.onSubmitTreatment(stepper);
    await fixture.whenStable();

    await vi.waitFor(() => {
      expect(component.treatmentCompleted()).toBe(true);
    });

    // Verify alert message via MatSnackBarHarness
    const snackBar = await rootLoader.getHarness(MatSnackBarHarness);
    expect(await snackBar.getMessage()).toContain('Treatment recorded successfully!');

    // Verify persisted state reflects the updated treatment cost in hospital data store
    const earningsReport = dataAdapter.getDoctorEarningsReport(() => 2026);
    await vi.waitFor(() => {
      expect(earningsReport.value()).toBeDefined();
    });

    const drWeberEarnings = earningsReport
      .value()
      ?.data.find((d) => d.name === 'Dr. Alexander Weber');
    expect(drWeberEarnings?.totalCosts).toBe(180);
  });

  it('should prevent submission when treatment form violates validation schema', async () => {
    component.selectedPatient.set(samplePatient);
    component.selectedAppointment.set(sampleAppointment);

    // Negative cost violates validation schema
    component.treatmentModel.set({
      description: 'Invalid cost test',
      cost: -50,
      medications: [],
    });
    await fixture.whenStable();

    await component.onSubmitTreatment(stepper);
    await fixture.whenStable();

    expect(component.treatmentCompleted()).toBe(false);
  });

  it('should reset workflow state and stepper when resetWorkflow is called', async () => {
    component.selectedPatient.set(samplePatient);
    component.selectedAppointment.set(sampleAppointment);
    component.treatmentCompleted.set(true);

    component.resetWorkflow(stepper);
    await fixture.whenStable();

    expect(component.selectedPatient()).toBeNull();
    expect(component.selectedAppointment()).toBeNull();
    expect(component.treatmentCompleted()).toBe(false);
    expect(component.treatmentModel()).toEqual({
      description: '',
      cost: 0,
      medications: [],
    });
    expect(stepper.selectedIndex).toBe(0);
  });

  it('should display error snackbar via MatSnackBarHarness when addTreatment fails without port method spying', async () => {
    const rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);

    component.selectedPatient.set(samplePatient);
    component.selectedAppointment.set(sampleAppointment);
    component.treatmentModel.set({
      description: 'Valid treatment',
      cost: 100,
      medications: [],
    });

    const originalAddTreatment = dataAdapter.addTreatment.bind(dataAdapter);
    dataAdapter.addTreatment = async () => {
      throw new Error('Database connection timed out.');
    };

    try {
      await component.onSubmitTreatment(stepper);
      await fixture.whenStable();

      const snackBar = await rootLoader.getHarness(MatSnackBarHarness);
      expect(await snackBar.getMessage()).toContain('Database connection timed out.');
      expect(component.treatmentCompleted()).toBe(false);
    } finally {
      dataAdapter.addTreatment = originalAddTreatment;
    }
  });
});
