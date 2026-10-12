import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatStepperHarness } from '@angular/material/stepper/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatAutocompleteHarness } from '@angular/material/autocomplete/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatDatepickerInputHarness } from '@angular/material/datepicker/testing';
import { MatSnackBarHarness } from '@angular/material/snack-bar/testing';
import { By } from '@angular/platform-browser';
import { MatStepper } from '@angular/material/stepper';
import { ClerkUseCase } from './clerk-use-case';
import { ClerkService } from '../services/clerk-service';
import { Clerk, Doctor, Patient } from '../models/models';
import { HOSPITAL_DATA_ACCESS, HospitalDataAccess } from '../services/hospital-data-access';
import { provideTestHospitalData } from '../services/in-memory-hospital-data-adapter';

describe('ClerkUseCase', () => {
  let component: ClerkUseCase;
  let fixture: ComponentFixture<ClerkUseCase>;
  let clerkService: ClerkService;
  let dataAccess: HospitalDataAccess;
  let loader: HarnessLoader;
  let rootLoader: HarnessLoader;
  let stepperHarness: MatStepperHarness;

  const mockClerk: Clerk = { id: '1001', name: 'Erika Mustermann', ssn: '1001' };
  const mockPatient: Patient = {
    id: '2002',
    name: 'Johann Schmidt',
    ssn: '2002',
    insurance: 'BVAEB',
    nacaScore: 2,
  };
  const mockDoctors: Doctor[] = [
    {
      id: '3001',
      name: 'Dr. Alexander Weber',
      ssn: '3001',
      specialty: 'Cardiology',
      position: 'Chief of Department',
      department: 'Cardiology',
    },
    {
      id: '3002',
      name: 'Dr. Sarah Jenkins',
      ssn: '3002',
      specialty: 'Neurology',
      position: 'Attending',
      department: 'Neurology',
    },
    {
      id: '3003',
      name: 'Dr. Michael Chen',
      ssn: '3003',
      specialty: 'Orthopedics',
      position: 'Senior Resident',
      department: 'Orthopedics',
    },
  ];

  async function bookAllDaySlots(doctorSsn: string, date: string, patientSsn = '2001') {
    const times = [
      '08:00',
      '08:30',
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '11:30',
      '12:00',
      '12:30',
      '13:00',
      '13:30',
      '14:00',
      '14:30',
      '15:00',
      '15:30',
      '16:00',
      '16:30',
      '17:00',
    ];
    for (const time of times) {
      try {
        await dataAccess.bookAppointment({
          patientSsn,
          doctorSsn,
          date,
          time,
        });
      } catch {
        // already booked
      }
    }
  }

  async function advanceToStep(targetIndex: number): Promise<void> {
    const steps = await stepperHarness.getSteps();
    for (let i = 0; i < targetIndex; i++) {
      if (await steps[i].isSelected()) {
        const nextBtn = await steps[i].getHarness(MatButtonHarness.with({ text: /Next/i }));
        await nextBtn.click();
        await fixture.whenStable();
      }
    }
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideNativeDateAdapter(),
        ClerkService,
        provideTestHospitalData(),
      ],
    });

    clerkService = TestBed.inject(ClerkService);
    clerkService.setActiveClerk(mockClerk);
    dataAccess = TestBed.inject(HOSPITAL_DATA_ACCESS);

    fixture = TestBed.createComponent(ClerkUseCase);
    component = fixture.componentInstance;
    await vi.waitFor(() => {
      expect(component.allDoctors().length).toBeGreaterThan(0);
    });
    await fixture.whenStable();

    loader = TestbedHarnessEnvironment.loader(fixture);
    rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    stepperHarness = await loader.getHarness(MatStepperHarness);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reflect active clerk from ClerkService', () => {
    expect(component.activeClerk()).toEqual(mockClerk);
  });

  it('should set selected patient and reset downstream selections', () => {
    component.selectPatient(mockPatient);
    expect(component.selectedPatient()).toEqual(mockPatient);
    expect(component.selectedTimeSlot()).toBeNull();
  });

  it('should filter doctors by selected department', () => {
    component.onDepartmentChange('Cardiology');

    expect(component.filteredDoctors().length).toBe(1);
    expect(component.filteredDoctors()[0].name).toBe('Dr. Alexander Weber');
  });

  it('should clear selected time slot when doctor or department changes', () => {
    component.selectTimeSlot('09:00');
    component.onDepartmentChange('Cardiology');
    expect(component.selectedTimeSlot()).toBeNull();

    component.selectTimeSlot('09:00');
    component.onDoctorChange(mockDoctors[0]);
    expect(component.selectedTimeSlot()).toBeNull();
  });

  it('should correctly identify severe NACA scores (5-7)', () => {
    expect(component.isSevereNaca(undefined)).toBe(false);
    expect(component.isSevereNaca(2)).toBe(false);
    expect(component.isSevereNaca(4)).toBe(false);
    expect(component.isSevereNaca(5)).toBe(true);
    expect(component.isSevereNaca(7)).toBe(true);
  });

  it('should book appointment successfully and reflect in data store', async () => {
    component.selectPatient(mockPatient);
    component.selectDoctor(mockDoctors[0]);
    component.onDateChange(new Date(2026, 9, 20));
    component.selectTimeSlot('10:00');
    component.workflow.setReason('Routine checkup');

    await component.confirmBooking();

    expect(component.bookingSuccess()).toBe(true);
    const apptId = component.createdAppointmentId();
    expect(apptId).toBeDefined();

    // Assert Appointment record is created and retrievable in data store
    const patientRef = dataAccess.getPatientDetails(() => mockPatient.ssn);
    await vi.waitFor(() => {
      const patient = patientRef.value();
      expect(patient?.appointments?.some((a) => a.id === apptId)).toBe(true);
    });
    const appt = patientRef.value()?.appointments?.find((a) => a.id === apptId);
    expect(appt?.reason).toBe('Routine checkup');
    expect(appt?.time).toBe('10:00');
    expect(appt?.doctorName).toBe('Dr. Alexander Weber');

    // Assert chosen Time Slot is marked unavailable in data store
    const slotsRef = dataAccess.getTimeSlots(() => ({
      date: '2026-10-20',
      doctorSsn: mockDoctors[0].ssn,
    }));
    await vi.waitFor(() => {
      const slot = slotsRef.value()?.slots.find((s) => s.time === '10:00');
      expect(slot?.available).toBe(false);
    });
  });

  it('should allow clearing active clerk profile', () => {
    expect(component.activeClerk()).toEqual(mockClerk);
    component.clearClerk();
    expect(component.activeClerk()).toBeNull();
  });

  it('should initialize minDate at midnight (00:00:00) so today is selectable', () => {
    expect(component.minDate.getHours()).toBe(0);
    expect(component.minDate.getMinutes()).toBe(0);
    expect(component.minDate.getSeconds()).toBe(0);
    expect(component.minDate.getMilliseconds()).toBe(0);
  });

  it('should toggle time slot selection on click', () => {
    component.selectTimeSlot('09:00');
    expect(component.selectedTimeSlot()).toBe('09:00');

    // Clicking the same slot toggles it off
    component.selectTimeSlot('09:00');
    expect(component.selectedTimeSlot()).toBeNull();

    // Selecting a different slot sets it
    component.selectTimeSlot('09:30');
    expect(component.selectedTimeSlot()).toBe('09:30');
  });

  it('should compare doctors by SSN accurately', () => {
    expect(component.compareDoctor(mockDoctors[0], mockDoctors[0])).toBe(true);
    expect(component.compareDoctor(mockDoctors[0], { ...mockDoctors[0] })).toBe(true);
    expect(component.compareDoctor(mockDoctors[0], mockDoctors[1])).toBe(false);
    expect(component.compareDoctor(mockDoctors[0], null)).toBe(false);
  });

  it('should reset workflow state while preserving active clerk profile', () => {
    component.selectPatient(mockPatient);
    component.selectDoctor(mockDoctors[0]);
    component.selectTimeSlot('09:00');
    component.workflow.setReason('Routine checkup');

    component.resetWorkflow();

    expect(component.selectedPatient()).toBeNull();
    expect(component.selectedDoctor()).toBeNull();
    expect(component.selectedTimeSlot()).toBeNull();
    expect(component.reason()).toBe('');
    expect(component.bookingSuccess()).toBe(false);
    expect(component.activeClerk()).toEqual(mockClerk);
  });

  it('should update patientInputValue immediately on typing and debounce search query', async () => {
    vi.useFakeTimers();
    try {
      const mockEvent = { target: { value: 'Johann' } } as unknown as Event;
      component.onPatientSearchInput(mockEvent);

      expect(component.patientInputValue()).toBe('Johann');
      expect(component.patientSearchQuery()).toBe(''); // Debounced

      vi.advanceTimersByTime(300);
      expect(component.patientSearchQuery()).toBe('Johann');
    } finally {
      vi.useRealTimers();
    }
  });

  it('should format patient details into patientInputValue when selecting patient', () => {
    component.selectPatient(mockPatient);
    expect(component.patientInputValue()).toBe('Johann Schmidt (SSN: 2002)');
    expect(component.patientSearchQuery()).toBe('Johann Schmidt');
  });

  it('should clear patientInputValue and patientSearchQuery on workflow reset', () => {
    component.onPatientSearchInput({ target: { value: 'Johann' } } as any);
    component.resetWorkflow();
    expect(component.patientInputValue()).toBe('');
    expect(component.patientSearchQuery()).toBe('');
  });

  it('should return informative NACA tooltip text', () => {
    expect(component.getNacaTooltip(undefined)).toBe('');
    expect(component.getNacaTooltip(null)).toBe('');
    expect(component.getNacaTooltip(2)).toContain('NACA 2: Pre-hospital severity score');
    expect(component.getNacaTooltip(6)).toContain('NACA 6: Pre-hospital severity score');
  });

  it('should render a quiet, de-escalated NACA chip in Step 1 without alarm icons', async () => {
    const severePatient: Patient = {
      id: '9999',
      name: 'Severe Record Patient',
      ssn: '9999',
      insurance: 'ÖGK',
      nacaScore: 6,
    };
    component.selectPatient(severePatient);
    await fixture.whenStable();

    const nacaChip = fixture.nativeElement.querySelector('.naca-chip');
    expect(nacaChip).toBeTruthy();
    expect(nacaChip.textContent).toContain('NACA 6');

    // Emergency alarm icon and critical class should NOT be present
    expect(fixture.nativeElement.querySelector('.naca-icon')).toBeNull();
    expect(nacaChip.classList.contains('naca-critical')).toBe(false);
  });

  it('should render the persistent clinical summary strip in Step 2 with patient details and unselected doctor placeholder', async () => {
    component.selectPatient(mockPatient);
    await fixture.whenStable();
    await advanceToStep(1);

    const steps = await stepperHarness.getSteps();
    expect(await steps[1].isSelected()).toBe(true);
    const strip = fixture.nativeElement.querySelector('.clinical-summary-strip');
    expect(strip).toBeTruthy();

    const patientCol = strip.querySelector('.patient-col');
    expect(patientCol.textContent).toContain('Johann Schmidt');
    expect(patientCol.textContent).toContain('2002');
    expect(patientCol.textContent).toContain('BVAEB');

    const doctorCol = strip.querySelector('.doctor-col');
    expect(doctorCol.textContent).toContain('Not selected');
  });

  it('should eliminate the Step 3 memory bridge by displaying both patient and doctor context persistently', async () => {
    component.selectPatient(mockPatient);
    await advanceToStep(1);
    component.selectDoctor(mockDoctors[0]);
    await advanceToStep(2);

    const steps = await stepperHarness.getSteps();
    expect(await steps[2].isSelected()).toBe(true);
    const strip = fixture.nativeElement.querySelector('.clinical-summary-strip');
    expect(strip).toBeTruthy();

    // Patient context is fully preserved (no memory bridge!)
    const patientCol = strip.querySelector('.patient-col');
    expect(patientCol.textContent).toContain('Johann Schmidt');
    expect(patientCol.textContent).toContain('2002');
    expect(patientCol.textContent).toContain('BVAEB');

    // Doctor context is also visible simultaneously
    const doctorCol = strip.querySelector('.doctor-col');
    expect(doctorCol.textContent).toContain('Dr. Alexander Weber');
    expect(doctorCol.textContent).toContain('Cardiology');
  });

  it('should maintain the persistent clinical summary strip in Step 4', async () => {
    component.selectPatient(mockPatient);
    await advanceToStep(1);
    component.selectDoctor(mockDoctors[0]);
    await advanceToStep(2);
    component.selectTimeSlot('09:00');
    await advanceToStep(3);

    const steps = await stepperHarness.getSteps();
    expect(await steps[3].isSelected()).toBe(true);
    const strip = fixture.nativeElement.querySelector('.clinical-summary-strip');
    expect(strip).toBeTruthy();

    expect(strip.querySelector('.patient-col').textContent).toContain('Johann Schmidt');
    expect(strip.querySelector('.doctor-col').textContent).toContain('Dr. Alexander Weber');
  });

  it('should remove clinical summary strip when workflow is reset', async () => {
    const stepperDebug = fixture.debugElement.query(By.directive(MatStepper));
    const stepperInstance = stepperDebug.componentInstance as MatStepper;

    component.selectPatient(mockPatient);
    await advanceToStep(1);
    component.selectDoctor(mockDoctors[0]);
    await advanceToStep(2);

    const steps = await stepperHarness.getSteps();
    expect(await steps[2].isSelected()).toBe(true);
    expect(fixture.nativeElement.querySelector('.clinical-summary-strip')).toBeTruthy();

    component.resetWorkflow(stepperInstance);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.clinical-summary-strip')).toBeNull();
    expect(await steps[0].isSelected()).toBe(true);
  });

  it('should not auto-advance stepper on patient selection', async () => {
    const steps = await stepperHarness.getSteps();
    expect(await steps[0].isSelected()).toBe(true);
    component.selectPatient(mockPatient);
    await fixture.whenStable();
    expect(await steps[0].isSelected()).toBe(true);
  });

  it('should render canonical bottom action bar in Step 1 with Next button bound to selectedPatient state', async () => {
    await fixture.whenStable();

    const steps = await stepperHarness.getSteps();
    const nextBtn = await steps[0].getHarness(MatButtonHarness.with({ text: /Next/i }));
    expect(await nextBtn.isDisabled()).toBe(true);

    component.selectPatient(mockPatient);
    await fixture.whenStable();

    expect(await nextBtn.isDisabled()).toBe(false);
  });

  it('should purge redundant inline Next buttons from entity preview cards in Step 1 and Step 2', async () => {
    component.selectPatient(mockPatient);
    await fixture.whenStable();

    const steps = await stepperHarness.getSteps();
    const step1Buttons = await steps[0].getAllHarnesses(MatButtonHarness);
    // Only canonical Next action button exists in Step 1
    expect(step1Buttons.length).toBe(1);
    expect(await step1Buttons[0].getText()).toContain('Next');
    expect(await step1Buttons[0].isDisabled()).toBe(false);

    // Advance to Step 2
    await step1Buttons[0].click();
    await fixture.whenStable();
    component.onDoctorChange(mockDoctors[0]);
    await fixture.whenStable();

    const step2Buttons = await steps[1].getAllHarnesses(MatButtonHarness);
    // Only canonical Back and Next action buttons exist in Step 2
    expect(step2Buttons.length).toBe(2);
    const buttonTexts = await Promise.all(step2Buttons.map((b) => b.getText()));
    expect(buttonTexts.some((t) => t.includes('Back'))).toBe(true);
    expect(buttonTexts.some((t) => t.includes('Next'))).toBe(true);

    const step2NextBtn = await steps[1].getHarness(MatButtonHarness.with({ text: /Next/i }));
    expect(await step2NextBtn.isDisabled()).toBe(false);
  });

  it('should render neutralized no-slots banner when all slots are booked', async () => {
    await bookAllDaySlots(mockDoctors[0].ssn, '2026-10-15');

    component.selectPatient(mockPatient);
    await advanceToStep(1);
    component.selectDoctor(mockDoctors[0]);
    component.onDateChange(new Date(2026, 9, 15));
    await vi.waitFor(() => {
      expect(component.timeSlots().length).toBe(19);
      expect(component.hasAvailableSlots()).toBe(false);
    });
    await advanceToStep(2);

    const steps = await stepperHarness.getSteps();
    expect(await steps[2].isSelected()).toBe(true);

    const banner = fixture.nativeElement.querySelector('.no-slots-banner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('No available slots on this date');
    expect(banner.classList.contains('mat-sys-error-container')).toBe(false);
    expect(banner.classList.contains('error')).toBe(false);
  });

  it('should display proactive guidance with next available date and allow one-click selection', async () => {
    await bookAllDaySlots(mockDoctors[0].ssn, '2026-10-15');

    component.selectPatient(mockPatient);
    await advanceToStep(1);
    component.selectDoctor(mockDoctors[0]);
    component.onDateChange(new Date(2026, 9, 15));
    await vi.waitFor(() => {
      expect(component.nextAvailableDate()).toBe('2026-10-16');
    });
    await advanceToStep(2);

    const steps = await stepperHarness.getSteps();
    expect(await steps[2].isSelected()).toBe(true);

    const banner = fixture.nativeElement.querySelector('.no-slots-banner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('No available slots on this date.');
    expect(banner.textContent).toContain('Next available: Friday, Oct 16');

    // Click next available date button via component harness
    const nextBtn = await steps[2].getHarness(MatButtonHarness.with({ text: /Select Date/i }));
    expect(nextBtn).toBeTruthy();
    await nextBtn.click();
    await fixture.whenStable();

    expect(component.formattedDate()).toBe('2026-10-16');
  });

  it('should display neutral fallback guidance when no next available date is specified', async () => {
    // Book all slots for this doctor for 15 consecutive days starting 2026-10-15
    for (let offset = 0; offset <= 14; offset++) {
      const d = new Date(2026, 9, 15 + offset);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      await bookAllDaySlots(mockDoctors[0].ssn, dateStr);
    }

    component.selectPatient(mockPatient);
    await advanceToStep(1);
    component.selectDoctor(mockDoctors[0]);
    component.onDateChange(new Date(2026, 9, 15));
    await vi.waitFor(() => {
      expect(component.hasAvailableSlots()).toBe(false);
      expect(component.nextAvailableDate()).toBeNull();
    });
    await advanceToStep(2);

    const steps = await stepperHarness.getSteps();
    expect(await steps[2].isSelected()).toBe(true);

    const banner = fixture.nativeElement.querySelector('.no-slots-banner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('No available slots on this date.');
    expect(banner.textContent).toContain('All time slots are booked for this doctor');
    const nextDateButtons = await steps[2].getAllHarnesses(
      MatButtonHarness.with({ text: /Select Date/i }),
    );
    expect(nextDateButtons.length).toBe(0);
  });

  it('should render active clerk card with structured entity card grammar and Change action', async () => {
    await fixture.whenStable();

    const clerkCard = fixture.nativeElement.querySelector('.active-clerk-card');
    expect(clerkCard).toBeTruthy();
    expect(clerkCard.classList.contains('active-clerk-badge')).toBe(true);

    const clerkLabel = clerkCard.querySelector('.clerk-label');
    expect(clerkLabel).toBeTruthy();
    expect(clerkLabel.textContent).toContain('Acting Clerk');

    const clerkName = clerkCard.querySelector('.clerk-name');
    expect(clerkName).toBeTruthy();
    expect(clerkName.textContent).toContain('Erika Mustermann');
    expect(clerkName.textContent).toContain('1001');

    const changeBtn = await loader.getHarness(MatButtonHarness.with({ text: /Change/i }));
    expect(changeBtn).toBeTruthy();
    const changeBtnHost = await changeBtn.host();
    expect(await changeBtnHost.getAttribute('aria-label')).toBe('Change acting clerk');
    expect(await changeBtn.getText()).toContain('Change');
  });

  it('should shift focus to clerk search input when clearing clerk', async () => {
    await fixture.whenStable();

    expect(component.activeClerk()).toEqual(mockClerk);
    component.clearClerk();
    await fixture.whenStable();

    const clerkInput = await loader.getHarness(
      MatInputHarness.with({ placeholder: /Search clerk/i }),
    );
    expect(clerkInput).toBeTruthy();
    expect(await clerkInput.isFocused()).toBe(true);
  });

  it('should trigger clearClerk and focus input when clicking Change button in active clerk card', async () => {
    await fixture.whenStable();

    const changeBtn = await loader.getHarness(MatButtonHarness.with({ text: /Change/i }));
    expect(changeBtn).toBeTruthy();

    await changeBtn.click();
    await fixture.whenStable();

    expect(component.activeClerk()).toBeNull();
    const clerkInput = await loader.getHarness(
      MatInputHarness.with({ placeholder: /Search clerk/i }),
    );
    expect(clerkInput).toBeTruthy();
    expect(await clerkInput.isFocused()).toBe(true);
  });

  it('should not contain invalid density attribute on mat-form-field when clerk is unselected', async () => {
    component.clearClerk();
    await fixture.whenStable();

    const formField = await loader.getHarness(
      MatFormFieldHarness.with({ floatingLabelText: 'Assign Acting Clerk' }),
    );
    expect(formField).toBeTruthy();
    const host = await formField.host();
    expect(await host.getAttribute('density')).toBeNull();
    expect(await host.getAttribute('subscriptSizing')).toBe('dynamic');
    expect(await formField.getAppearance()).toBe('outline');
  });

  it('should support full clerk change cycle: select, clear, and reselect another clerk', async () => {
    await fixture.whenStable();

    // Initially active clerk is mockClerk (1001)
    expect(component.activeClerk()?.name).toBe('Erika Mustermann');

    // User clicks change
    const changeBtn = await loader.getHarness(MatButtonHarness.with({ text: /Change/i }));
    await changeBtn.click();
    await fixture.whenStable();

    expect(component.activeClerk()).toBeNull();

    // User selects a different clerk via autocomplete harness
    const clerkAuto = await loader.getHarness(MatAutocompleteHarness);
    await clerkAuto.enterText('Max');
    await vi.waitFor(() => {
      expect(component.availableClerks().length).toBeGreaterThan(0);
    });
    await clerkAuto.selectOption({ text: /Max Mustermann/ });
    await fixture.whenStable();

    expect(component.activeClerk()?.name).toBe('Max Mustermann');
    expect(component.activeClerk()?.ssn).toBe('1002');
  });

  it('should display full clerk name and SSN in title tooltip for long clerk names', async () => {
    const longNameClerk: Clerk = {
      id: '1003',
      name: 'Dr. Maximilian Alexander Bartholomew Constantine von Hapsburg',
      ssn: '1003',
    };
    component.selectClerk(longNameClerk);
    await fixture.whenStable();

    const clerkCard = fixture.nativeElement.querySelector('.active-clerk-card');
    const clerkNameEl = clerkCard.querySelector('.clerk-name') as HTMLElement;
    expect(clerkNameEl).toBeTruthy();
    expect(clerkNameEl.getAttribute('title')).toBe(
      'Dr. Maximilian Alexander Bartholomew Constantine von Hapsburg (SSN: 1003)',
    );
    expect(clerkNameEl.textContent).toContain('Dr. Maximilian Alexander');
  });

  it('should preserve .clerk-context-box container in both selected and unselected states', async () => {
    // Selected state
    await fixture.whenStable();
    const contextBoxSelected = fixture.nativeElement.querySelector('.clerk-context-box');
    expect(contextBoxSelected).toBeTruthy();
    expect(contextBoxSelected.querySelector('.active-clerk-card')).toBeTruthy();
    expect(contextBoxSelected.querySelector('.clerk-picker')).toBeNull();

    // Unselected state
    component.clearClerk();
    await fixture.whenStable();
    const contextBoxUnselected = fixture.nativeElement.querySelector('.clerk-context-box');
    expect(contextBoxUnselected).toBeTruthy();
    expect(contextBoxUnselected.querySelector('.active-clerk-card')).toBeNull();
    expect(contextBoxUnselected.querySelector('.clerk-picker')).toBeTruthy();
  });

  describe('Component Harness Multi-Step Wizard Interactions', () => {
    it('should search and select patient using MatAutocompleteHarness in Step 1', async () => {
      const steps = await stepperHarness.getSteps();
      expect(await steps[0].isSelected()).toBe(true);

      const patientAuto = await steps[0].getHarness(MatAutocompleteHarness);
      await patientAuto.enterText('Johann');

      await vi.waitFor(async () => {
        expect(component.patients().length).toBeGreaterThan(0);
        if (!(await patientAuto.isOpen())) {
          await patientAuto.focus();
        }
        expect(await patientAuto.isOpen()).toBe(true);
      });

      await patientAuto.selectOption({ text: /Johann Schmidt/ });
      await fixture.whenStable();

      expect(component.selectedPatient()?.ssn).toBe(mockPatient.ssn);
      expect(component.selectedPatient()?.name).toBe(mockPatient.name);

      const nextBtn = await steps[0].getHarness(MatButtonHarness.with({ text: /Next/i }));
      expect(await nextBtn.isDisabled()).toBe(false);
    });

    it('should select department and doctor using MatSelectHarness in Step 2', async () => {
      component.selectPatient(mockPatient);
      await advanceToStep(1);

      const steps = await stepperHarness.getSteps();
      expect(await steps[1].isSelected()).toBe(true);

      const formFields = await steps[1].getAllHarnesses(MatFormFieldHarness);

      // Hospital Department select
      const deptSelect = await formFields[0].getControl(MatSelectHarness);
      expect(deptSelect).not.toBeNull();
      await deptSelect!.open();
      await deptSelect!.clickOptions({ text: 'Cardiology' });
      await fixture.whenStable();

      expect(component.selectedDepartment()).toBe('Cardiology');

      // Attending Doctor select
      const docSelect = await formFields[1].getControl(MatSelectHarness);
      expect(docSelect).not.toBeNull();
      await docSelect!.open();
      await docSelect!.clickOptions({ text: /Dr\. Alexander Weber/ });
      await fixture.whenStable();

      expect(component.selectedDoctor()?.name).toBe('Dr. Alexander Weber');

      const nextBtn = await steps[1].getHarness(MatButtonHarness.with({ text: /Next/i }));
      expect(await nextBtn.isDisabled()).toBe(false);
    });

    it('should select consultation date and time slot using datepicker and button harnesses in Step 3', async () => {
      component.selectPatient(mockPatient);
      await advanceToStep(1);
      component.selectDoctor(mockDoctors[0]);
      await advanceToStep(2);

      const steps = await stepperHarness.getSteps();
      expect(await steps[2].isSelected()).toBe(true);

      const dateInput = await steps[2].getHarness(MatDatepickerInputHarness);
      await dateInput.setValue('10/20/2026');
      await fixture.whenStable();

      await vi.waitFor(() => {
        expect(component.timeSlots().length).toBeGreaterThan(0);
      });

      const slotBtn = await steps[2].getHarness(MatButtonHarness.with({ text: /10:00/ }));
      expect(await slotBtn.isDisabled()).toBe(false);

      await slotBtn.click();
      await fixture.whenStable();

      expect(component.selectedTimeSlot()).toBe('10:00');

      const nextBtn = await steps[2].getHarness(MatButtonHarness.with({ text: /Next/i }));
      expect(await nextBtn.isDisabled()).toBe(false);
    });

    it('should allow navigating back to previously completed steps via MatStepHarness.select()', async () => {
      component.selectPatient(mockPatient);
      await advanceToStep(1);
      component.selectDoctor(mockDoctors[0]);
      await advanceToStep(2);

      const steps = await stepperHarness.getSteps();
      expect(await steps[2].isSelected()).toBe(true);

      // Navigate back to Step 1
      await steps[0].select();
      await fixture.whenStable();
      expect(await steps[0].isSelected()).toBe(true);

      // Navigate back to Step 2
      await steps[1].select();
      await fixture.whenStable();
      expect(await steps[1].isSelected()).toBe(true);

      // Return to Step 3
      await steps[2].select();
      await fixture.whenStable();
      expect(await steps[2].isSelected()).toBe(true);
    });

    it('should submit appointment booking form through Step 4 harnesses and confirm in data store', async () => {
      component.selectPatient(mockPatient);
      await advanceToStep(1);
      component.selectDoctor(mockDoctors[0]);
      await advanceToStep(2);
      component.selectTimeSlot('10:00');
      await advanceToStep(3);

      const steps = await stepperHarness.getSteps();
      expect(await steps[3].isSelected()).toBe(true);

      const reasonField = await steps[3].getHarness(
        MatFormFieldHarness.with({ floatingLabelText: /Consultation Reason/ }),
      );
      const reasonInput = await reasonField.getControl(MatInputHarness);
      expect(reasonInput).not.toBeNull();
      await reasonInput!.setValue('Routine checkup');
      await fixture.whenStable();

      const bookBtn = await steps[3].getHarness(
        MatButtonHarness.with({ text: /Book Appointment/i }),
      );
      await bookBtn.click();
      await fixture.whenStable();

      expect(component.bookingSuccess()).toBe(true);
      const apptId = component.createdAppointmentId();
      expect(apptId).toBeDefined();

      // Verify Appointment record is created and retrievable in data store
      const patientRef = dataAccess.getPatientDetails(() => mockPatient.ssn);
      await vi.waitFor(() => {
        expect(patientRef.value()?.appointments?.some((a) => a.id === apptId)).toBe(true);
      });

      // Verify Schedule Another Appointment button resets the stepper back to Step 1
      const scheduleAnotherBtn = await steps[3].getHarness(
        MatButtonHarness.with({ text: /Schedule Another Appointment/i }),
      );
      await scheduleAnotherBtn.click();
      await fixture.whenStable();

      expect(await steps[0].isSelected()).toBe(true);
      expect(component.selectedPatient()).toBeNull();
    });

    it('should handle 409 conflict during booking via harnesses, recover to Step 3, and reload slots', async () => {
      component.selectPatient(mockPatient);
      await advanceToStep(1);
      component.selectDoctor(mockDoctors[0]);
      await advanceToStep(2);

      const steps = await stepperHarness.getSteps();
      const dateInput = await steps[2].getHarness(MatDatepickerInputHarness);
      await dateInput.setValue('10/20/2026');
      await fixture.whenStable();
      await vi.waitFor(() => {
        expect(component.timeSlots().length).toBeGreaterThan(0);
      });

      const slotBtn = await steps[2].getHarness(MatButtonHarness.with({ text: /11:00/ }));
      expect(await slotBtn.isDisabled()).toBe(false);
      await slotBtn.click();
      await fixture.whenStable();
      expect(component.selectedTimeSlot()).toBe('11:00');

      // Advance to Step 4 via Next button
      const nextBtn3 = await steps[2].getHarness(MatButtonHarness.with({ text: /Next/i }));
      await nextBtn3.click();
      await fixture.whenStable();
      expect(await steps[3].isSelected()).toBe(true);

      // Concurrently pre-book the slot in data store to induce genuine 409 conflict upon submit
      await dataAccess.bookAppointment({
        patientSsn: '2001',
        doctorSsn: mockDoctors[0].ssn,
        date: '2026-10-20',
        time: '11:00',
        reason: 'Colliding booking',
      });

      // Submit on Step 4
      const bookBtn = await steps[3].getHarness(
        MatButtonHarness.with({ text: /Book Appointment/i }),
      );
      await bookBtn.click();
      await fixture.whenStable();

      expect(component.bookingSuccess()).toBe(false);
      expect(component.selectedTimeSlot()).toBeNull();

      // Verify stepper recovered back to Step 3 (index 2)
      expect(await steps[2].isSelected()).toBe(true);

      // Verify snackbar alert was displayed
      const snackBar = await rootLoader.getHarness(MatSnackBarHarness);
      expect(await snackBar.getMessage()).toContain(
        'Selected slot was just booked by another user. Please choose an alternate slot.',
      );

      // Verify slots were reloaded and 11:00 slot is now disabled in Step 3
      await vi.waitFor(() => {
        const slot = component.timeSlots().find((s) => s.time === '11:00');
        expect(slot?.available).toBe(false);
      });
      const updatedSlotBtn = await steps[2].getHarness(MatButtonHarness.with({ text: /11:00/ }));
      expect(await updatedSlotBtn.isDisabled()).toBe(true);
    });
  });
});
