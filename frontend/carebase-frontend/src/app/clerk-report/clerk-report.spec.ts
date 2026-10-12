import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { vi } from 'vitest';
import { ClerkReport } from './clerk-report';
import { HOSPITAL_DATA_ACCESS } from '../services/hospital-data-access';
import { InMemoryHospitalDataAdapter } from '../services/in-memory-hospital-data-adapter';

describe('ClerkReport', () => {
  let component: ClerkReport;
  let fixture: ComponentFixture<ClerkReport>;
  let dataAdapter: InMemoryHospitalDataAdapter;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideNativeDateAdapter(),
        { provide: HOSPITAL_DATA_ACCESS, useClass: InMemoryHospitalDataAdapter },
      ],
    });

    dataAdapter = TestBed.inject(HOSPITAL_DATA_ACCESS) as InMemoryHospitalDataAdapter;

    // Seed consultation records into the in-memory hospital data store
    // Initial data in adapter already contains:
    // - Maria Gruber (2001) with Dr. Alexander Weber (3001) on 2026-09-10 (1 visit)
    // - Johann Schmidt (2002) with Dr. Alexander Weber (3001) on 2026-10-15 (1 visit)
    // Add additional appointments to test aggregation and frequency distribution:
    await dataAdapter.bookAppointment({
      patientSsn: '2001',
      doctorSsn: '3001',
      date: '2026-09-11',
      time: '10:00',
    });
    await dataAdapter.bookAppointment({
      patientSsn: '2001',
      doctorSsn: '3001',
      date: '2026-09-12',
      time: '10:00',
    });
    await dataAdapter.bookAppointment({
      patientSsn: '2003',
      doctorSsn: '3002',
      date: '2026-09-15',
      time: '09:00',
    });
    await dataAdapter.bookAppointment({
      patientSsn: '2003',
      doctorSsn: '3002',
      date: '2026-09-16',
      time: '09:00',
    });

    fixture = TestBed.createComponent(ClerkReport);
    component = fixture.componentInstance;
    await vi.waitFor(() => {
      expect(component.reportData().length).toBeGreaterThan(0);
    });
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

  it('should accurately calculate KPIs: unique patients, active doctors, and total consultations from hospital data', () => {
    expect(component.totalUniquePatients()).toBe(3);
    expect(component.totalActiveDoctors()).toBe(2);
    expect(component.totalConsultations()).toBe(6);
  });

  it('should aggregate chart data by doctor correctly', () => {
    const chart = component.chartData();
    expect(chart.length).toBe(2);
    // Dr. Alexander Weber has 3 + 1 = 4 visits
    const weber = chart.find((c) => c.name === 'Dr. Alexander Weber');
    expect(weber?.value).toBe(4);
    // Dr. Sarah Jenkins has 2 visits
    const jenkins = chart.find((c) => c.name === 'Dr. Sarah Jenkins');
    expect(jenkins?.value).toBe(2);
  });

  it('should filter table rows by search term across patient, doctor, and SSN', () => {
    component.searchFilter.set('Johann');
    expect(component.filteredTableData().length).toBe(1);
    expect(component.filteredTableData()[0].patientName).toBe('Johann Schmidt');

    component.searchFilter.set('Neurology');
    expect(component.filteredTableData().length).toBe(1);
    expect(component.filteredTableData()[0].specialty).toBe('Neurology');

    component.searchFilter.set('3001');
    expect(component.filteredTableData().length).toBe(2);
  });

  it('should sort table rows accurately when column header is clicked', () => {
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
    expect(component.sortedTableData()[0].patientName).toBe('Anna Fischer');
  });

  it('should reload and update report when generating report with existing date parameters', async () => {
    expect(component.totalConsultations()).toBe(6);

    // Book an additional appointment in the data store during the active date range
    await dataAdapter.bookAppointment({
      patientSsn: '2003',
      doctorSsn: '3002',
      date: '2026-09-17',
      time: '11:00',
    });

    component.onGenerateReport();
    await vi.waitFor(() => {
      expect(component.totalConsultations()).toBe(7);
    });
  });

  it('should provide explicit reloadReport method to refresh resolved data state', async () => {
    expect(component.totalConsultations()).toBe(6);

    // Book an additional appointment in the data store
    await dataAdapter.bookAppointment({
      patientSsn: '2002',
      doctorSsn: '3001',
      date: '2026-10-16',
      time: '14:00',
    });

    component.reloadReport();
    await vi.waitFor(() => {
      expect(component.totalConsultations()).toBe(7);
    });
  });

  it('should filter consultations within a specific sub-range via date range parameters', async () => {
    component.startDate.set('2026-10-01');
    component.endDate.set('2026-10-31');
    component.onGenerateReport();

    await vi.waitFor(() => {
      expect(component.totalConsultations()).toBe(1);
    });

    expect(component.totalUniquePatients()).toBe(1);
    expect(component.totalActiveDoctors()).toBe(1);
    expect(component.filteredTableData()[0].patientName).toBe('Johann Schmidt');
  });

  it('should display 0 for KPIs and clear derivations when no records exist (Exception Scenario A)', async () => {
    component.startDate.set('2025-01-01');
    component.endDate.set('2025-12-31');
    component.onGenerateReport();

    await vi.waitFor(() => {
      expect(component.reportData().length).toBe(0);
    });
    await fixture.whenStable();

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
