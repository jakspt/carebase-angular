import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DoctorReport } from './doctor-report';
import { HOSPITAL_DATA_ACCESS } from '../services/hospital-data-access';
import {
  InMemoryHospitalDataAdapter,
  provideTestHospitalData,
} from '../services/in-memory-hospital-data-adapter';

describe('DoctorReport', () => {
  let component: DoctorReport;
  let fixture: ComponentFixture<DoctorReport>;
  let dataAdapter: InMemoryHospitalDataAdapter;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [DoctorReport],
      providers: [provideNoopAnimations(), provideTestHospitalData()],
    });

    dataAdapter = TestBed.inject(HOSPITAL_DATA_ACCESS) as InMemoryHospitalDataAdapter;
    fixture = TestBed.createComponent(DoctorReport);
    component = fixture.componentInstance;
    component.selectedYear.set(2026);
    await fixture.whenStable();

    await vi.waitFor(() => {
      expect(component.reportData().length).toBeGreaterThan(0);
    });
    await fixture.whenStable();
  });

  it('should render report header, title, and subtitle', () => {
    const title = fixture.nativeElement.querySelector('.report-title');
    expect(title?.textContent).toContain('Treatment Costs by Doctor');

    const subtitle = fixture.nativeElement.querySelector('.subtitle');
    expect(subtitle?.textContent).toContain(
      'Overview of accumulated medical treatment expenditures',
    );
  });

  it('should load annual treatment expenditure aggregations for the selected year', async () => {
    const data = component.reportData();
    expect(data.length).toBe(3);

    // Initial seeded data: Dr. Alexander Weber has appointment 101 with 250 EUR treatment
    const drWeber = data.find((d) => d.name === 'Dr. Alexander Weber');
    expect(drWeber).toBeDefined();
    expect(drWeber?.totalCosts).toBe(250);
    expect(drWeber?.year).toBe(2026);
    expect(drWeber?.specialty).toBe('Cardiology');
  });

  it('should render detailed breakdown table with doctor rows and formatted total costs', () => {
    const table = fixture.nativeElement.querySelector('.report-table');
    expect(table).toBeTruthy();

    const headers = Array.from(table.querySelectorAll('th')).map((th: any) =>
      th.textContent.trim(),
    );
    expect(headers).toEqual(['SSN', 'Doctor', 'Specialty', 'Dept', 'Year', 'Total (€)']);

    const rows = fixture.nativeElement.querySelectorAll('.report-table tbody tr');
    expect(rows.length).toBe(3);

    const firstRowText = rows[0].textContent;
    expect(firstRowText).toContain('Dr. Alexander Weber');
    expect(firstRowText).toContain('Cardiology');
    expect(firstRowText).toContain('2026');
    expect(firstRowText).toMatch(/250[,.]00/);
  });

  it('should aggregate and rank practitioners in chartData sorted descending by total expenditures', async () => {
    // Add additional treatment for Dr. Sarah Jenkins (3002)
    const booking = await dataAdapter.bookAppointment({
      patientSsn: '2003',
      doctorSsn: '3002',
      date: '2026-06-15',
      time: '11:00',
    });
    await dataAdapter.addTreatment('2003', booking.appointmentId!, {
      description: 'Neurological exam and MRI',
      cost: 750,
      medications: [],
    });

    await vi.waitFor(() => {
      const data = component.reportData();
      const jenkins = data.find((d) => d.name === 'Dr. Sarah Jenkins');
      expect(jenkins?.totalCosts).toBe(750);
    });

    const chart = component.chartData();
    expect(chart.length).toBe(3);
    // Dr. Sarah Jenkins (750) ranks first ahead of Dr. Alexander Weber (250)
    expect(chart[0].name).toBe('Dr. Sarah Jenkins');
    expect(chart[0].value).toBe(750);
    expect(chart[1].name).toBe('Dr. Alexander Weber');
    expect(chart[1].value).toBe(250);
    expect(chart[2].name).toBe('Dr. Michael Chen');
    expect(chart[2].value).toBe(0);
  });

  it('should recalculate report data and table rows when reporting year changes', async () => {
    component.onYearChange(2025);
    await fixture.whenStable();

    await vi.waitFor(() => {
      const data = component.reportData();
      expect(data[0].year).toBe(2025);
    });

    // In 2025, no treatments were recorded, so all totals are 0
    expect(component.reportData().every((d) => d.totalCosts === 0)).toBe(true);
    expect(component.chartData().every((c) => c.value === 0)).toBe(true);

    // Switch back to 2026
    component.onYearChange(2026);
    await fixture.whenStable();

    await vi.waitFor(() => {
      const drWeber = component.reportData().find((d) => d.name === 'Dr. Alexander Weber');
      expect(drWeber?.totalCosts).toBeGreaterThan(0);
    });
  });

  it('should paginate detailed breakdown table correctly', async () => {
    component.pageSize.set(2);
    component.pageIndex.set(0);
    await fixture.whenStable();

    expect(component.pagedReportData().length).toBe(2);

    component.onPageChange({ pageIndex: 1, pageSize: 2, length: 3 });
    await fixture.whenStable();

    expect(component.pageIndex()).toBe(1);
    expect(component.pageSize()).toBe(2);
    expect(component.pagedReportData().length).toBe(1);
    expect(component.pagedReportData()[0].name).toBe('Dr. Michael Chen');
  });

  it('should render empty state message when no report records exist via DI adapter stub', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DoctorReport],
      providers: [
        provideNoopAnimations(),
        {
          provide: HOSPITAL_DATA_ACCESS,
          useValue: {
            getDoctorEarningsReport: () => ({
              hasValue: () => true,
              isLoading: () => false,
              value: () => ({ year: 2020, data: [] }),
            }),
          },
        },
      ],
    });

    const emptyFixture = TestBed.createComponent(DoctorReport);
    emptyFixture.componentInstance.selectedYear.set(2020);
    await emptyFixture.whenStable();

    const emptyContainer = emptyFixture.nativeElement.querySelector('.state-container.empty');
    expect(emptyContainer).toBeTruthy();
    expect(emptyContainer.textContent).toContain('No Records Found');
    expect(emptyContainer.textContent).toContain(
      'No treatments or costs were registered for the year 2020',
    );
  });
});
