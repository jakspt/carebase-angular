import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { signal, WritableSignal } from '@angular/core';
import { ClerkUseCase } from './clerk-use-case';
import { ClerkService } from '../services/clerk-service';
import { of, throwError } from 'rxjs';
import { Clerk, Doctor, Patient, TimeSlotsResponse } from '../models/models';
import { By } from '@angular/platform-browser';
import { MatStepper } from '@angular/material/stepper';
import { HOSPITAL_DATA_ACCESS } from '../services/hospital-data-access';
import { InMemoryHospitalDataAdapter } from '../services/in-memory-hospital-data-adapter';

describe('ClerkUseCase', () => {
  let component: ClerkUseCase;
  let fixture: ComponentFixture<ClerkUseCase>;
  let clerkService: ClerkService;
  let mockSlotsSignal: WritableSignal<TimeSlotsResponse | undefined>;

  const mockClerk: Clerk = { id: '1001', name: 'Erika Mustermann', ssn: '1001' };
  const mockPatient: Patient = {
    id: '2041',
    name: 'Johann Schmidt',
    ssn: '2041',
    insurance: 'ÖGK',
    nacaScore: 2,
  };
  const mockDoctors: Doctor[] = [
    {
      id: '3011',
      name: 'Dr. Sarah Connor',
      ssn: '3011',
      specialty: 'Cardiology',
      position: 'Chief Physician',
      department: 'Cardiology',
    },
    {
      id: '3012',
      name: 'Dr. John Smith',
      ssn: '3012',
      specialty: 'Neurology',
      position: 'Specialist',
      department: 'Neurology',
    },
  ];

  beforeEach(async () => {
    mockSlotsSignal = signal<TimeSlotsResponse | undefined>({
      date: '2026-10-15',
      doctorSsn: '3011',
      slots: [],
      nextAvailableDate: null,
    });

    await TestBed.configureTestingModule({
      imports: [ClerkUseCase],
      providers: [
        provideNativeDateAdapter(),
        ClerkService,
        { provide: HOSPITAL_DATA_ACCESS, useClass: InMemoryHospitalDataAdapter },
      ],
    }).compileComponents();

    clerkService = TestBed.inject(ClerkService);
    clerkService.setActiveClerk(mockClerk);
    const dataAccess = TestBed.inject(HOSPITAL_DATA_ACCESS);

    vi.spyOn(dataAccess, 'getDoctors').mockReturnValue({
      value: signal(mockDoctors),
      hasValue: signal(true),
      isLoading: signal(false),
      error: signal(undefined),
      reload: vi.fn(),
    } as any);

    vi.spyOn(dataAccess, 'getTimeSlots').mockReturnValue({
      value: mockSlotsSignal,
      hasValue: signal(true),
      isLoading: signal(false),
      error: signal(undefined),
      reload: vi.fn(),
    } as any);

    fixture = TestBed.createComponent(ClerkUseCase);
    component = fixture.componentInstance;
    await fixture.whenStable();
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
    expect(component.filteredDoctors()[0].name).toBe('Dr. Sarah Connor');
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

  it('should book appointment successfully via ClerkService', async () => {
    const bookSpy = vi.spyOn(clerkService, 'bookAppointment').mockReturnValue(
      of({
        success: true,
        appointmentId: 42,
        message: 'Appointment successfully scheduled',
      }),
    );

    component.selectPatient(mockPatient);
    component.selectDoctor(mockDoctors[0]);
    component.onDateChange(new Date(2026, 9, 15));
    component.selectTimeSlot('09:00');
    component.workflow.setReason('Routine checkup');

    await component.confirmBooking();

    expect(bookSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        patientSsn: '2041',
        doctorSsn: '3011',
        date: '2026-10-15',
        time: '09:00',
        reason: 'Routine checkup',
        clerkSsn: '1001',
      }),
    );
    expect(component.bookingSuccess()).toBe(true);
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
    expect(component.activeClerk()).toEqual(mockClerk); // Preserved per AC-1.1.2
  });

  it('should handle 409 conflict during booking and reload slots', async () => {
    vi.spyOn(clerkService, 'bookAppointment').mockReturnValue(
      throwError(() => ({
        status: 409,
        error: { error: 'The doctor already has an appointment scheduled at this time.' },
      })),
    );
    const reloadSpy = vi.spyOn(component.timeSlotsResource, 'reload').mockReturnValue(true);
    const mockStepper = { selectedIndex: 3 } as any;

    component.selectPatient(mockPatient);
    component.selectDoctor(mockDoctors[0]);
    component.onDateChange(new Date(2026, 9, 15));
    component.selectTimeSlot('09:00');

    await component.confirmBooking(mockStepper);

    expect(component.bookingSuccess()).toBe(false);
    expect(component.selectedTimeSlot()).toBeNull();
    expect(reloadSpy).toHaveBeenCalled();
    expect(mockStepper.selectedIndex).toBe(2);
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
    expect(component.patientInputValue()).toBe('Johann Schmidt (SSN: 2041)');
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

  it('should render a quiet, de-escalated NACA chip in the selected patient card without alarm icons', async () => {
    const severePatient: Patient = {
      id: '9999',
      name: 'Severe Record Patient',
      ssn: '9999',
      insurance: 'ÖGK',
      nacaScore: 6,
    };
    component.selectPatient(severePatient);
    fixture.detectChanges();
    await fixture.whenStable();

    const card = fixture.nativeElement.querySelector('.selected-entity-card');
    expect(card).toBeTruthy();

    const nacaChip = card.querySelector('.naca-chip');
    expect(nacaChip).toBeTruthy();
    expect(nacaChip.textContent).toContain('NACA 6');

    // Emergency alarm icon and critical class should NOT be present
    expect(card.querySelector('.naca-icon')).toBeNull();
    expect(nacaChip.classList.contains('naca-critical')).toBe(false);
  });

  it('should render the persistent clinical summary strip in Step 2 with patient details and unselected doctor placeholder', async () => {
    const stepper = fixture.debugElement.query(By.directive(MatStepper))
      .componentInstance as MatStepper;
    component.selectPatient(mockPatient);
    fixture.detectChanges();
    stepper.selectedIndex = 1;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(stepper.selectedIndex).toBe(1);
    const strip = fixture.nativeElement.querySelector('.clinical-summary-strip');
    expect(strip).toBeTruthy();

    const patientCol = strip.querySelector('.patient-col');
    expect(patientCol.textContent).toContain('Johann Schmidt');
    expect(patientCol.textContent).toContain('2041');
    expect(patientCol.textContent).toContain('ÖGK');

    const doctorCol = strip.querySelector('.doctor-col');
    expect(doctorCol.textContent).toContain('Not selected');
  });

  it('should eliminate the Step 3 memory bridge by displaying both patient and doctor context persistently', async () => {
    const stepper = fixture.debugElement.query(By.directive(MatStepper))
      .componentInstance as MatStepper;
    component.selectPatient(mockPatient);
    component.selectDoctor(mockDoctors[0]);
    fixture.detectChanges();
    stepper.selectedIndex = 2;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(stepper.selectedIndex).toBe(2);
    const strip = fixture.nativeElement.querySelector('.clinical-summary-strip');
    expect(strip).toBeTruthy();

    // Patient context is fully preserved (no memory bridge!)
    const patientCol = strip.querySelector('.patient-col');
    expect(patientCol.textContent).toContain('Johann Schmidt');
    expect(patientCol.textContent).toContain('2041');
    expect(patientCol.textContent).toContain('ÖGK');

    // Doctor context is also visible simultaneously
    const doctorCol = strip.querySelector('.doctor-col');
    expect(doctorCol.textContent).toContain('Dr. Sarah Connor');
    expect(doctorCol.textContent).toContain('Cardiology');
  });

  it('should maintain the persistent clinical summary strip in Step 4', async () => {
    const stepper = fixture.debugElement.query(By.directive(MatStepper))
      .componentInstance as MatStepper;
    component.selectPatient(mockPatient);
    component.selectDoctor(mockDoctors[0]);
    component.selectTimeSlot('09:00');
    fixture.detectChanges();
    stepper.selectedIndex = 3;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(stepper.selectedIndex).toBe(3);
    const strip = fixture.nativeElement.querySelector('.clinical-summary-strip');
    expect(strip).toBeTruthy();

    expect(strip.querySelector('.patient-col').textContent).toContain('Johann Schmidt');
    expect(strip.querySelector('.doctor-col').textContent).toContain('Dr. Sarah Connor');
  });

  it('should remove clinical summary strip when workflow is reset', async () => {
    const stepper = fixture.debugElement.query(By.directive(MatStepper))
      .componentInstance as MatStepper;
    component.selectPatient(mockPatient);
    component.selectDoctor(mockDoctors[0]);
    fixture.detectChanges();
    stepper.selectedIndex = 2;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.clinical-summary-strip')).toBeTruthy();

    component.resetWorkflow(stepper);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.clinical-summary-strip')).toBeNull();
  });

  it('should not auto-advance stepper on patient selection', () => {
    const stepper = fixture.debugElement.query(By.directive(MatStepper))
      .componentInstance as MatStepper;
    stepper.selectedIndex = 0;
    component.selectPatient(mockPatient, stepper);
    expect(stepper.selectedIndex).toBe(0);
  });

  it('should render canonical bottom action bar in Step 1 with Next button bound to selectedPatient state', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const stepContainers = fixture.nativeElement.querySelectorAll('.step-container');
    const step1Container = stepContainers[0];
    const step1Actions = step1Container.querySelector('.step-actions');
    expect(step1Actions).toBeTruthy();

    const nextBtn = step1Actions.querySelector('button[matStepperNext]') as HTMLButtonElement;
    expect(nextBtn).toBeTruthy();
    expect(nextBtn.disabled).toBe(true);

    component.selectPatient(mockPatient);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(nextBtn.disabled).toBe(false);
  });

  it('should purge redundant inline Next buttons from entity preview cards in Step 1 and Step 2', async () => {
    component.selectPatient(mockPatient);
    fixture.detectChanges();
    await fixture.whenStable();

    const stepContainers = fixture.nativeElement.querySelectorAll('.step-container');
    const step1Card = stepContainers[0].querySelector('.selected-entity-card');
    expect(step1Card).toBeTruthy();
    expect(step1Card.querySelector('button')).toBeNull();

    // In Step 2
    component.onDoctorChange(mockDoctors[0]);
    fixture.detectChanges();
    await fixture.whenStable();

    const step2Card = stepContainers[1].querySelector('.selected-entity-card');
    expect(step2Card).toBeTruthy();
    expect(step2Card.querySelector('button')).toBeNull();

    // Step 2 canonical action bar still exists
    const step2Actions = stepContainers[1].querySelector('.step-actions');
    expect(step2Actions).toBeTruthy();
    const step2NextBtn = step2Actions.querySelector('button[matStepperNext]') as HTMLButtonElement;
    expect(step2NextBtn).toBeTruthy();
    expect(step2NextBtn.disabled).toBe(false);
  });

  it('should render neutralized no-slots banner when all slots are booked', async () => {
    const stepper = fixture.debugElement.query(By.directive(MatStepper))
      .componentInstance as MatStepper;
    component.selectPatient(mockPatient);
    component.selectDoctor(mockDoctors[0]);
    mockSlotsSignal.set({
      date: '2026-10-15',
      doctorSsn: '3011',
      slots: [
        { time: '08:00', available: false },
        { time: '08:30', available: false },
      ],
      nextAvailableDate: null,
    });
    fixture.detectChanges();
    stepper.selectedIndex = 2;
    fixture.detectChanges();
    await fixture.whenStable();

    const banner = fixture.nativeElement.querySelector('.no-slots-banner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('No available slots on this date');
    expect(banner.classList.contains('mat-sys-error-container')).toBe(false);
    expect(banner.classList.contains('error')).toBe(false);
  });

  it('should display proactive guidance with next available date and allow one-click selection', async () => {
    const stepper = fixture.debugElement.query(By.directive(MatStepper))
      .componentInstance as MatStepper;
    component.selectPatient(mockPatient);
    component.selectDoctor(mockDoctors[0]);
    // 2025-10-16 is Thursday, Oct 16
    mockSlotsSignal.set({
      date: '2026-10-15',
      doctorSsn: '3011',
      slots: [
        { time: '08:00', available: false },
        { time: '08:30', available: false },
      ],
      nextAvailableDate: '2025-10-16',
    });
    fixture.detectChanges();
    stepper.selectedIndex = 2;
    fixture.detectChanges();
    await fixture.whenStable();

    const banner = fixture.nativeElement.querySelector('.no-slots-banner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('No available slots on this date.');
    expect(banner.textContent).toContain('Next available: Thursday, Oct 16');

    // Click next available date button
    const nextBtn = banner.querySelector('.next-available-btn') as HTMLButtonElement;
    expect(nextBtn).toBeTruthy();
    nextBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.formattedDate()).toBe('2025-10-16');
  });

  it('should display neutral fallback guidance when no next available date is specified', async () => {
    const stepper = fixture.debugElement.query(By.directive(MatStepper))
      .componentInstance as MatStepper;
    component.selectPatient(mockPatient);
    component.selectDoctor(mockDoctors[0]);
    mockSlotsSignal.set({
      date: '2026-10-15',
      doctorSsn: '3011',
      slots: [{ time: '08:00', available: false }],
      nextAvailableDate: null,
    });
    fixture.detectChanges();
    stepper.selectedIndex = 2;
    fixture.detectChanges();
    await fixture.whenStable();

    const banner = fixture.nativeElement.querySelector('.no-slots-banner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('No available slots on this date.');
    expect(banner.textContent).toContain('All time slots are booked for this doctor');
    expect(banner.querySelector('.next-available-btn')).toBeNull();
  });

  it('should render active clerk card with structured entity card grammar and Change action', async () => {
    fixture.detectChanges();
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

    const changeBtn = clerkCard.querySelector('.change-clerk-btn') as HTMLButtonElement;
    expect(changeBtn).toBeTruthy();
    expect(changeBtn.getAttribute('aria-label')).toBe('Change acting clerk');
    expect(changeBtn.textContent).toContain('Change');
    expect(changeBtn.querySelector('mat-icon')?.textContent).toContain('edit');
  });

  it('should shift focus to clerk search input when clearing clerk', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.activeClerk()).toEqual(mockClerk);
    component.clearClerk();
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('.clerk-picker input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(document.activeElement).toBe(input);
  });

  it('should trigger clearClerk and focus input when clicking Change button in active clerk card', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const changeBtn = fixture.nativeElement.querySelector('.change-clerk-btn') as HTMLButtonElement;
    expect(changeBtn).toBeTruthy();

    changeBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.activeClerk()).toBeNull();
    const input = fixture.nativeElement.querySelector('.clerk-picker input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(document.activeElement).toBe(input);
  });

  it('should not contain invalid density attribute on mat-form-field when clerk is unselected', async () => {
    component.clearClerk();
    fixture.detectChanges();
    await fixture.whenStable();

    const formField = fixture.nativeElement.querySelector('.clerk-select-field');
    expect(formField).toBeTruthy();
    expect(formField.getAttribute('density')).toBeNull();
    const subscript = formField.querySelector('.mat-mdc-form-field-subscript-wrapper');
    expect(subscript).toBeTruthy();
  });

  it('should support full clerk change cycle: select, clear, and reselect another clerk', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    // Initially active clerk is mockClerk (1001)
    expect(component.activeClerk()?.name).toBe('Erika Mustermann');

    // User clicks change
    component.clearClerk();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.activeClerk()).toBeNull();
    expect(fixture.nativeElement.querySelector('.clerk-picker')).toBeTruthy();

    // User selects a different clerk
    const secondClerk: Clerk = { id: '1002', name: 'Max Mustermann', ssn: '1002' };
    component.selectClerk(secondClerk);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.activeClerk()).toEqual(secondClerk);
    const updatedCard = fixture.nativeElement.querySelector('.active-clerk-card');
    expect(updatedCard).toBeTruthy();
    expect(updatedCard.querySelector('.clerk-name')?.textContent).toContain('Max Mustermann');
    expect(updatedCard.querySelector('.clerk-name')?.getAttribute('title')).toBe(
      'Max Mustermann (SSN: 1002)',
    );
  });

  it('should display full clerk name and SSN in title tooltip for long clerk names', async () => {
    const longNameClerk: Clerk = {
      id: '1003',
      name: 'Dr. Maximilian Alexander Bartholomew Constantine von Hapsburg',
      ssn: '1003',
    };
    component.selectClerk(longNameClerk);
    fixture.detectChanges();
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
    fixture.detectChanges();
    await fixture.whenStable();
    const contextBoxSelected = fixture.nativeElement.querySelector('.clerk-context-box');
    expect(contextBoxSelected).toBeTruthy();
    expect(contextBoxSelected.querySelector('.active-clerk-card')).toBeTruthy();
    expect(contextBoxSelected.querySelector('.clerk-picker')).toBeNull();

    // Unselected state
    component.clearClerk();
    fixture.detectChanges();
    await fixture.whenStable();
    const contextBoxUnselected = fixture.nativeElement.querySelector('.clerk-context-box');
    expect(contextBoxUnselected).toBeTruthy();
    expect(contextBoxUnselected.querySelector('.active-clerk-card')).toBeNull();
    expect(contextBoxUnselected.querySelector('.clerk-picker')).toBeTruthy();
  });
});
