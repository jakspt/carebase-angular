import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ClerkReport } from './clerk-report';
import { HOSPITAL_DATA_ACCESS } from '../services/hospital-data-access';
import { InMemoryHospitalDataAdapter } from '../services/in-memory-hospital-data-adapter';
import { PatientVisitRecord } from '../models/models';

describe('ClerkReport', () => {
  let component: ClerkReport;
  let fixture: ComponentFixture<ClerkReport>;

  const mockRecords: PatientVisitRecord[] = [
    {
      patientSsn: '2041',
      patientName: 'Johann Schmidt',
      insurance: 'ÖGK',
      doctorSsn: '3011',
      doctorName: 'Dr. Sarah Connor',
      specialty: 'Cardiology',
      department: 'Cardiology',
      visitCount: 3,
    },
    {
      patientSsn: '2042',
      patientName: 'Anna Frank',
      insurance: 'BVAEB',
      doctorSsn: '3011',
      doctorName: 'Dr. Sarah Connor',
      specialty: 'Cardiology',
      department: 'Cardiology',
      visitCount: 1,
    },
    {
      patientSsn: '2043',
      patientName: 'Max Mustermann',
      insurance: 'SVS',
      doctorSsn: '3012',
      doctorName: 'Dr. John Smith',
      specialty: 'Neurology',
      department: 'Neurology',
      visitCount: 2,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClerkReport],
      providers: [
        provideAnimationsAsync(),
        provideNativeDateAdapter(),
        { provide: HOSPITAL_DATA_ACCESS, useClass: InMemoryHospitalDataAdapter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClerkReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with current year date bounds (01-01 to 12-31)', () => {
    const currentYear = new Date().getFullYear();
    expect(component.startDate()).toBe(`${currentYear}-01-01`);
    expect(component.endDate()).toBe(`${currentYear}-12-31`);
    expect(component.isDateRangeValid()).toBe(true);
  });

  it('should invalidate when startDate > endDate', () => {
    component.startDate.set('2026-12-31');
    component.endDate.set('2026-01-01');
    expect(component.isDateRangeValid()).toBe(false);
  });

  it('should accurately calculate KPIs: unique patients, active doctors, and total visits', () => {
    (component as any).reportDataSignal.set(mockRecords);

    expect(component.totalUniquePatients()).toBe(3);
    expect(component.totalActiveDoctors()).toBe(2);
    expect(component.totalConsultations()).toBe(6);
  });

  it('should aggregate chart data by doctor correctly', () => {
    (component as any).reportDataSignal.set(mockRecords);

    const chart = component.chartData();
    expect(chart.length).toBe(2);
    // Dr. Sarah Connor has 3 + 1 = 4 visits
    const sarah = chart.find((c) => c.name === 'Dr. Sarah Connor');
    expect(sarah?.value).toBe(4);
    // Dr. John Smith has 2 visits
    const john = chart.find((c) => c.name === 'Dr. John Smith');
    expect(john?.value).toBe(2);
  });

  it('should filter table rows by search term across patient, doctor, and SSN', () => {
    (component as any).reportDataSignal.set(mockRecords);

    component.searchFilter.set('Johann');
    expect(component.filteredTableData().length).toBe(1);
    expect(component.filteredTableData()[0].patientName).toBe('Johann Schmidt');

    component.searchFilter.set('Neurology');
    expect(component.filteredTableData().length).toBe(1);
    expect(component.filteredTableData()[0].specialty).toBe('Neurology');

    component.searchFilter.set('3011');
    expect(component.filteredTableData().length).toBe(2);
  });

  it('should sort table rows accurately when column header is clicked', () => {
    (component as any).reportDataSignal.set(mockRecords);

    // Sort by visitCount ascending
    component.onSortChange({ active: 'visitCount', direction: 'asc' });
    expect(component.sortedTableData()[0].visitCount).toBe(1);
    expect(component.sortedTableData()[2].visitCount).toBe(3);

    // Sort by visitCount descending
    component.onSortChange({ active: 'visitCount', direction: 'desc' });
    expect(component.sortedTableData()[0].visitCount).toBe(3);
    expect(component.sortedTableData()[2].visitCount).toBe(1);

    // Sort by patientName ascending
    component.onSortChange({ active: 'patientName', direction: 'asc' });
    expect(component.sortedTableData()[0].patientName).toBe('Anna Frank');
  });

  it('should trigger reload when generating report with existing date parameters', () => {
    const reloadSpy = vi.spyOn(component.reportResource, 'reload').mockReturnValue(true);

    component.onGenerateReport();
    expect(reloadSpy).toHaveBeenCalled();
  });

  it('should provide explicit reloadReport method for retry banner', () => {
    const reloadSpy = vi.spyOn(component.reportResource, 'reload').mockReturnValue(true);

    component.reloadReport();
    expect(reloadSpy).toHaveBeenCalled();
  });

  it('should display 0 for KPIs and show empty banner when no records exist (Exception Scenario A)', () => {
    (component as any).reportDataSignal.set([]);

    expect(component.totalUniquePatients()).toBe(0);
    expect(component.totalActiveDoctors()).toBe(0);
    expect(component.totalConsultations()).toBe(0);
    expect(component.chartData()).toEqual([]);
    expect(component.filteredTableData()).toEqual([]);
  });

  it('should support single-day date range where startDate equals endDate (Exception Scenario B)', () => {
    component.startDate.set('2026-05-10');
    component.endDate.set('2026-05-10');
    expect(component.isDateRangeValid()).toBe(true);
    expect(component.dateErrorMessage()).toBe('');
  });
});
