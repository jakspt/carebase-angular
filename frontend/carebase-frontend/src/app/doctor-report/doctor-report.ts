import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { BarChartModule } from '@swimlane/ngx-charts';
import { HOSPITAL_DATA_ACCESS } from '../services';
import { DoctorEarnings } from '../models/models';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, of, switchMap, timer } from 'rxjs';

interface ChartDataItem {
  name: string;
  value: number;
}

@Component({
  imports: [
    CurrencyPipe,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatPaginatorModule,
    BarChartModule,
  ],
  selector: 'app-doctor-report',
  styleUrl: './doctor-report.css',
  templateUrl: './doctor-report.html',
})
export class DoctorReport {
  private readonly hospitalDataAccess = inject(HOSPITAL_DATA_ACCESS);

  readonly currentYear = new Date().getFullYear();
  readonly availableYears: number[] = Array.from(
    { length: this.currentYear - 2020 + 1 },
    (_, i) => this.currentYear - i,
  );

  readonly selectedYear = signal<number>(this.currentYear);

  readonly reportResource = this.hospitalDataAccess.getDoctorEarningsReport(this.selectedYear);

  private readonly spinnerDelayMs = 250;
  readonly showSpinner = toSignal(
    toObservable(this.reportResource.isLoading).pipe(
      switchMap((loading) =>
        loading ? timer(this.spinnerDelayMs).pipe(map(() => true)) : of(false),
      ),
    ),
    { initialValue: false },
  );

  readonly reportData = computed<DoctorEarnings[]>(() => {
    if (this.reportResource.hasValue()) {
      return this.reportResource.value()?.data ?? [];
    }
    return [];
  });

  // Top 10 doctors with clean names (without IDs) for optimal bar readability
  readonly chartData = computed<ChartDataItem[]>(() => {
    const list = this.reportData();
    const map = new Map<number, { name: string; total: number }>();
    for (const row of list) {
      const existing = map.get(row.id);
      if (existing) {
        existing.total += row.totalCosts;
      } else {
        map.set(row.id, {
          name: row.name,
          total: row.totalCosts,
        });
      }
    }
    return Array.from(map.values())
      .map((item) => ({ name: item.name, value: item.total }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  });

  // Table pagination
  readonly pageSize = signal<number>(10);
  readonly pageIndex = signal<number>(0);

  readonly pagedReportData = computed<DoctorEarnings[]>(() => {
    const list = this.reportData();
    const start = this.pageIndex() * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  readonly displayedColumns: string[] = [
    'id',
    'name',
    'specialty',
    'department',
    'year',
    'totalCosts',
  ];

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
    ],
  };

  onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }
}
