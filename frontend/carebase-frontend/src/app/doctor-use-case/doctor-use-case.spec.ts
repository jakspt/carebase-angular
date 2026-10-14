import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatStepperHarness } from '@angular/material/stepper/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { By } from '@angular/platform-browser';
import { MatStepper } from '@angular/material/stepper';
import { DoctorUseCase } from './doctor-use-case';
import { HOSPITAL_DATA_ACCESS } from '../services/hospital-data-access';
import {
  InMemoryHospitalDataAdapter,
  provideTestHospitalData,
} from '../services/in-memory-hospital-data-adapter';
import { Appointment, Patient } from '../models/models';
import { HeadlessSnackBar, provideTestOperationRunner } from '../services/operation-runner';

describe('DoctorUseCase', () => {
  let component: DoctorUseCase;
  let fixture: ComponentFixture<DoctorUseCase>;
  let dataAdapter: InMemoryHospitalDataAdapter;
  let feedback: HeadlessSnackBar;
  let stepper: MatStepper;
  let loader: HarnessLoader;
  let stepperHarness: MatStepperHarness;

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
      providers: [provideNoopAnimations(), provideTestHospitalData(), provideTestOperationRunner()],
    });

    fixture = TestBed.createComponent(DoctorUseCase);
    component = fixture.componentInstance;
    dataAdapter = TestBed.inject(HOSPITAL_DATA_ACCESS) as InMemoryHospitalDataAdapter;
    feedback = TestBed.inject(HeadlessSnackBar);
    await fixture.whenStable();

    loader = TestbedHarnessEnvironment.loader(fixture);
    stepperHarness = await loader.getHarness(MatStepperHarness);
    const stepperDebug = fixture.debugElement.query(By.directive(MatStepper));
    stepper = stepperDebug.componentInstance as MatStepper;
  });

  it('should create and initialize with default unselected state', async () => {
    expect(component).toBeTruthy();
    expect(component.selectedPatient()).toBeNull();
    expect(component.selectedAppointment()).toBeNull();
    expect(component.treatmentCompleted()).toBe(false);
    const steps = await stepperHarness.getSteps();
    expect(await steps[0].isSelected()).toBe(true);
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

    // Click Next button on the selected patient card via harness
    const steps = await stepperHarness.getSteps();
    const nextBtn = await steps[0].getHarness(MatButtonHarness.with({ text: /Next/i }));
    await nextBtn.click();
    await fixture.whenStable();

    expect(component.selectedPatient()).toEqual(patient);
    expect(await steps[1].isSelected()).toBe(true);

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

    const steps = await stepperHarness.getSteps();
    const nextBtn1 = await steps[0].getHarness(MatButtonHarness.with({ text: /Next/i }));
    await nextBtn1.click();
    await fixture.whenStable();

    await vi.waitFor(() => {
      expect(component.appointments().length).toBeGreaterThan(0);
    });

    const appointment = component.appointments()[0];
    component.onSelectAppointment(appointment, stepper);
    await fixture.whenStable();

    const nextBtn2 = await steps[1].getHarness(MatButtonHarness.with({ text: /Next/i }));
    await nextBtn2.click();
    await fixture.whenStable();

    expect(component.selectedAppointment()).toEqual(appointment);
    expect(await steps[2].isSelected()).toBe(true);
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
    const steps = await stepperHarness.getSteps();

    // Step 1: Search and select patient
    component.searchQuery.set('Maria');
    await vi.waitFor(() => {
      expect(component.patients().length).toBeGreaterThan(0);
    });
    const patient = component.patients()[0];
    component.onPatientSelected(patient, stepper);
    await fixture.whenStable();

    const nextBtn1 = await steps[0].getHarness(MatButtonHarness.with({ text: /Next/i }));
    await nextBtn1.click();
    await fixture.whenStable();
    expect(await steps[1].isSelected()).toBe(true);

    // Step 2: Select appointment
    await vi.waitFor(() => {
      expect(component.appointments().length).toBeGreaterThan(0);
    });
    const appointment = component.appointments()[0];
    component.onSelectAppointment(appointment, stepper);
    await fixture.whenStable();

    const nextBtn2 = await steps[1].getHarness(MatButtonHarness.with({ text: /Next/i }));
    await nextBtn2.click();
    await fixture.whenStable();
    expect(await steps[2].isSelected()).toBe(true);

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

    // Verify alert message via headless feedback provider
    expect(feedback.lastMessage()).toContain('Treatment recorded successfully!');
    expect(component.operationRunner).toBeDefined();

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

  it('should gate submission and deliver validation notification when treatment form violates schema constraints', async () => {
    component.selectedPatient.set(samplePatient);
    component.selectedAppointment.set(sampleAppointment);

    // Negative cost violates validation schema
    component.treatmentModel.set({
      description: 'Invalid negative cost test',
      cost: -50,
      medications: [],
    });
    await fixture.whenStable();

    const submitBtn = await loader.getHarness(
      MatButtonHarness.with({ text: /Complete Treatment/i }),
    );
    expect(await submitBtn.isDisabled()).toBe(true);

    await component.onSubmitTreatment(stepper);
    await fixture.whenStable();

    expect(component.treatmentCompleted()).toBe(false);
    expect(feedback.lastMessage()).toBe('Cost cannot be negative.');

    // Excessive cost violates upper bound
    component.treatmentModel.set({
      description: 'Invalid excessive cost test',
      cost: 15000,
      medications: [],
    });
    await fixture.whenStable();

    expect(await submitBtn.isDisabled()).toBe(true);

    await component.onSubmitTreatment(stepper);
    await fixture.whenStable();

    expect(component.treatmentCompleted()).toBe(false);
    expect(feedback.lastMessage()).toBe('Cost cannot exceed 9,999 €.');
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
    const steps = await stepperHarness.getSteps();
    expect(await steps[0].isSelected()).toBe(true);
  });

  it('should display error snackbar via headless feedback provider when addTreatment fails without port method spying', async () => {
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

      expect(feedback.lastMessage()).toContain('Database connection timed out.');
      expect(component.treatmentCompleted()).toBe(false);
    } finally {
      dataAdapter.addTreatment = originalAddTreatment;
    }
  });

  it('should lock submit button and stepper navigation controls while treatment mutation is in flight', async () => {
    component.selectedPatient.set(samplePatient);
    component.selectedAppointment.set(sampleAppointment);
    component.treatmentModel.set({
      description: 'In-flight locking test',
      cost: 250,
      medications: [],
    });
    await fixture.whenStable();

    // Advance stepper to Step 3 via button harnesses
    const steps = await stepperHarness.getSteps();
    const nextBtn1 = await steps[0].getHarness(MatButtonHarness.with({ text: /Next/i }));
    await nextBtn1.click();
    await fixture.whenStable();

    const nextBtn2 = await steps[1].getHarness(MatButtonHarness.with({ text: /Next/i }));
    await nextBtn2.click();
    await fixture.whenStable();

    expect(await steps[2].isSelected()).toBe(true);

    // Hold addTreatment resolution to inspect in-flight locked state
    let resolveMutation!: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveMutation = resolve;
    });

    const originalAddTreatment = dataAdapter.addTreatment.bind(dataAdapter);
    dataAdapter.addTreatment = () => pendingPromise as any;

    try {
      const submitPromise = component.onSubmitTreatment(stepper);
      await fixture.whenStable();

      // Verify runner lock is active
      expect(component.operationRunner.isLocked()).toBe(true);

      // Verify submit button is locked and shows loading state
      const submitBtn = await loader.getHarness(MatButtonHarness.with({ text: /Saving/i }));
      expect(await submitBtn.isDisabled()).toBe(true);

      // Verify stepper back button in Step 3 is disabled
      const step3 = steps[2];
      const backBtn = await step3.getHarness(MatButtonHarness.with({ text: /Back/i }));
      expect(await backBtn.isDisabled()).toBe(true);

      // Verify step header navigation is prevented while mutation is in flight
      await steps[0].select();
      await fixture.whenStable();
      expect(await steps[2].isSelected()).toBe(true);

      // Verify concurrent submission attempt is rejected without duplicate execution
      await component.onSubmitTreatment(stepper);
      expect(component.treatmentCompleted()).toBe(false);

      // Resolve pending mutation
      resolveMutation({ success: true });
      await submitPromise;
      await fixture.whenStable();

      // Verify runner unlocked and completed
      expect(component.operationRunner.isLocked()).toBe(false);
      expect(component.treatmentCompleted()).toBe(true);
    } finally {
      dataAdapter.addTreatment = originalAddTreatment;
    }
  });
});
