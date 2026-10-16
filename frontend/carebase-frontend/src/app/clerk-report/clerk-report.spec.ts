import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { MatSortHarness } from '@angular/material/sort/testing';
import { vi } from 'vitest';
import { ClerkReport } from './clerk-report';
import {
  type ConsultationFrequencyReport,
  HOSPITAL_DATA_ACCESS,
} from '../services/hospital-data-access';
import {
  InMemoryHospitalDataAdapter,
  provideTestHospitalData,
} from '../services/in-memory-hospital-data-adapter';

describe('ClerkReport', () => {
  let component: ClerkReport;
  let fixture: ComponentFixture<ClerkReport>;
  let loader: HarnessLoader;
  let dataAdapter: InMemoryHospitalDataAdapter;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideNoopAnimations(), provideNativeDateAdapter(), provideTestHospitalData()],
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
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    await vi.waitFor(() => {
      expect(component.reportData().length).toBeGreaterThan(0);
    });
    await fixture.whenStable();
  });

  it('should create and load consultation frequency report', () => {
    expect(component).toBeTruthy();
    const report: ConsultationFrequencyReport | undefined = component.reportResource.value();
    expect(report?.results).toBeDefined();
  });

  it('should render table rows matching consultation frequency report data via MatTableHarness', async () => {
    const table = await loader.getHarness(MatTableHarness);
    const rows = await table.getRows();
    expect(rows.length).toBe(3);
    const cols = await table.getCellTextByColumnName();
    const patientNames = cols['patientName'].text;
    expect(patientNames).toContain('Maria Gruber');
    expect(patientNames).toContain('Johann Schmidt');
    expect(patientNames).toContain('Anna Fischer');
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

  it('should filter table rows by search term across patient, doctor, and SSN', async () => {
    const table = await loader.getHarness(MatTableHarness);

    component.searchFilter.set('Johann');
    await fixture.whenStable();
    let rows = await table.getRows();
    expect(rows.length).toBe(1);
    let firstRowCells = await rows[0].getCellTextByColumnName();
    expect(firstRowCells['patientName']).toBe('Johann Schmidt');

    component.searchFilter.set('Neurology');
    await fixture.whenStable();
    rows = await table.getRows();
    expect(rows.length).toBe(1);
    firstRowCells = await rows[0].getCellTextByColumnName();
    expect(firstRowCells['specialty']).toBe('Neurology');

    component.searchFilter.set('3001');
    await fixture.whenStable();
    rows = await table.getRows();
    expect(rows.length).toBe(2);
  });

  it('should sort table rows accurately when column header is clicked', async () => {
    const sort = await loader.getHarness(MatSortHarness);
    const table = await loader.getHarness(MatTableHarness);
    const [visitHeader] = await sort.getSortHeaders({ label: 'Visits' });

    // Sort by visitCount ascending
    await visitHeader.click();
    await fixture.whenStable();

    let rows = await table.getRows();
    let firstRow = await rows[0].getCellTextByColumnName();
    let lastRow = await rows[2].getCellTextByColumnName();
    expect(firstRow['visitCount']).toBe('1');
    expect(lastRow['visitCount']).toBe('3');

    // Sort by visitCount descending
    await visitHeader.click();
    await fixture.whenStable();

    rows = await table.getRows();
    firstRow = await rows[0].getCellTextByColumnName();
    lastRow = await rows[2].getCellTextByColumnName();
    expect(firstRow['visitCount']).toBe('3');
    expect(lastRow['visitCount']).toBe('1');

    // Sort by patientName ascending
    const [patientHeader] = await sort.getSortHeaders({ label: 'Patient' });
    await patientHeader.click();
    await fixture.whenStable();

    rows = await table.getRows();
    firstRow = await rows[0].getCellTextByColumnName();
    expect(firstRow['patientName']).toBe('Anna Fischer');
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
    await fixture.whenStable();

    const table = await loader.getHarness(MatTableHarness);
    const rows = await table.getRows();
    expect(rows.length).toBe(1);
    const rowCells = await rows[0].getCellTextByColumnName();
    expect(component.totalUniquePatients()).toBe(1);
    expect(component.totalActiveDoctors()).toBe(1);
    expect(rowCells['patientName']).toBe('Johann Schmidt');
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
