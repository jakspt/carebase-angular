import { Component, computed, inject, signal, ResourceRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { BarChartModule } from '@swimlane/ngx-charts';
import { createDebouncedLoadingSignal } from '../utils';
import { ConsultationFrequencyReport, HOSPITAL_DATA_ACCESS } from '../services/hospital-data-access';
import { PatientVisitRecord } from '../models/models';

interface ChartDataItem {
  name: string;
  value: number;
}

@Component({
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatPaginatorModule,
    MatSortModule,
    BarChartModule,
  ],
  selector: 'app-clerk-report',
  styleUrl: './clerk-report.css',
  templateUrl: './clerk-report.html',
})
export class ClerkReport {
  private readonly hospitalDataAccess = inject(HOSPITAL_DATA_ACCESS);

  readonly currentYear = new Date().getFullYear();
  readonly startDate = signal<string>(`${this.currentYear}-01-01`);
  readonly endDate = signal<string>(`${this.currentYear}-12-31`);

  // Active query parameters signal (triggered by "Generate Report" or initial load)
  readonly activeRange = signal<{ startDate: string; endDate: string }>({
    startDate: `${this.currentYear}-01-01`,
    endDate: `${this.currentYear}-12-31`,
  });

  readonly isDateRangeValid = computed<boolean>(() => {
    const s = this.startDate();
    const e = this.endDate();
    if (!s || !e) return false;
    return s <= e;
  });

  readonly dateErrorMessage = computed<string>(() => {
    if (!this.startDate() || !this.endDate()) {
      return 'Please specify both start and end dates.';
    }
    if (this.startDate() > this.endDate()) {
      return 'Start date must be earlier than or equal to end date.';
    }
    return '';
  });

  readonly reportResource: ResourceRef<ConsultationFrequencyReport | undefined> =
    this.hospitalDataAccess.getConsultationFrequencyReport(this.activeRange);

  // Debounced progress indicator (<250ms threshold)
  readonly showSpinner = createDebouncedLoadingSignal(this.reportResource.isLoading);

  // Mockable signal for unit testing or live resource data
  readonly reportDataSignal = signal<PatientVisitRecord[] | null>(null);

  readonly reportData = computed<PatientVisitRecord[]>(() => {
    if (this.reportDataSignal()) {
      return this.reportDataSignal()!;
    }
    if (this.reportResource.hasValue()) {
      return this.reportResource.value()?.results ?? [];
    }
    return [];
  });

  readonly hasError = computed<boolean>(() => {
    if (this.reportDataSignal()) return false;
    return !!this.reportResource.error();
  });

  // ── KPI Computations ──
  readonly totalUniquePatients = computed<number>(() => {
    const list = this.reportData();
    const ssnSet = new Set<string>();
    for (const r of list) {
      if (r.patientSsn) ssnSet.add(r.patientSsn);
    }
    return ssnSet.size;
  });

  readonly totalActiveDoctors = computed<number>(() => {
    const list = this.reportData();
    const ssnSet = new Set<string>();
    for (const r of list) {
      if (r.doctorSsn) ssnSet.add(r.doctorSsn);
    }
    return ssnSet.size;
  });

  readonly totalConsultations = computed<number>(() => {
    return this.reportData().reduce((sum, r) => sum + (r.visitCount || 0), 0);
  });

  // ── Bar Chart Data ──
  readonly chartData = computed<ChartDataItem[]>(() => {
    const list = this.reportData();
    const map = new Map<string, { name: string; count: number }>();
    for (const row of list) {
      const key = row.doctorSsn || row.doctorName;
      const name = row.doctorName || (row.doctorSsn ? `Dr. (${row.doctorSsn})` : 'Unknown');
      const count = row.visitCount || 0;
      const existing = map.get(key);
      if (existing) {
        existing.count += count;
      } else {
        map.set(key, { name, count });
      }
    }
    return Array.from(map.values())
      .map((item) => ({ name: item.name, value: item.count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  });

  readonly customColorScheme: any = {
    domain: [
      '#006495',
      '#0082be',
      '#009fe8',
      '#29b4ff',
      '#5dc4ff',
      '#8cd3ff',
      '#bde4ff',
      '#004b72',
      '#0073ab',
      '#003350',
    ],
  };

  // ── Search & Table Pagination ──
  readonly searchFilter = signal<string>('');
  readonly pageSize = signal<number>(10);
  readonly pageIndex = signal<number>(0);
  readonly sortColumn = signal<string>('');
  readonly sortDirection = signal<'asc' | 'desc' | ''>('');

  readonly filteredTableData = computed<PatientVisitRecord[]>(() => {
    const list = this.reportData();
    const q = this.searchFilter().toLowerCase().trim();
    if (!q) return list;
    return list.filter((r) => {
      return (
        r.patientName.toLowerCase().includes(q) ||
        r.doctorName.toLowerCase().includes(q) ||
        r.patientSsn.toLowerCase().includes(q) ||
        r.doctorSsn.toLowerCase().includes(q) ||
        r.specialty.toLowerCase().includes(q) ||
        r.insurance.toLowerCase().includes(q)
      );
    });
  });

  readonly sortedTableData = computed<PatientVisitRecord[]>(() => {
    const data = [...this.filteredTableData()];
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (!col || !dir) return data;

    return data.sort((a: any, b: any) => {
      const valA = a[col] ?? '';
      const valB = b[col] ?? '';
      const compare =
        typeof valA === 'number' && typeof valB === 'number'
          ? valA - valB
          : String(valA).localeCompare(String(valB));
      return dir === 'asc' ? compare : -compare;
    });
  });

  readonly pagedTableData = computed<PatientVisitRecord[]>(() => {
    const list = this.sortedTableData();
    const start = this.pageIndex() * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  readonly displayedColumns: string[] = [
    'doctorName',
    'specialty',
    'patientName',
    'patientSsn',
    'insurance',
    'visitCount',
  ];

  onGenerateReport(): void {
    if (!this.isDateRangeValid()) return;
    const current = this.activeRange();
    if (current.startDate === this.startDate() && current.endDate === this.endDate()) {
      this.reportResource.reload();
    } else {
      this.activeRange.set({
        startDate: this.startDate(),
        endDate: this.endDate(),
      });
    }
    this.pageIndex.set(0);
  }

  reloadReport(): void {
    this.reportResource.reload();
  }

  onSearchChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchFilter.set(val);
    this.pageIndex.set(0);
  }

  onSortChange(sort: Sort): void {
    this.sortColumn.set(sort.active);
    this.sortDirection.set(sort.direction);
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }
}
