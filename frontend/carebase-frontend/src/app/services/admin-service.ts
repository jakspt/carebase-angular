import { HttpClient } from '@angular/common/http';
import { httpResource } from '@angular/common/http';
import { Provider, Service, inject, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { DbStatus } from '../models/models';

@Service()
export class AdminService {
  private readonly http = inject(HttpClient);

  readonly statusResource = httpResource<DbStatus>(() => '/api/status');

  seedDatabase(): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<{ success: boolean; message: string }>('/api/admin/seed', {})
      .pipe(tap(() => this.statusResource.reload()));
  }

  migrateDatabase(): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<{ success: boolean; message: string }>('/api/admin/migrate', {})
      .pipe(tap(() => this.statusResource.reload()));
  }

  refreshStatus(): void {
    this.statusResource.reload();
  }
}

export interface TestAdminServiceOptions {
  dbType?: DbStatus['dbType'];
  isLoading?: boolean;
  hasValue?: boolean;
}

export function provideTestAdminService(options?: TestAdminServiceOptions): Provider[] {
  const hasValue = options?.hasValue ?? options?.dbType !== undefined;
  const isLoading = options?.isLoading ?? false;
  const dbStatus: DbStatus | undefined = hasValue
    ? { dbType: options?.dbType ?? 'MariaDB' }
    : undefined;

  const mockAdminService = {
    statusResource: {
      value: signal<DbStatus | undefined>(dbStatus),
      isLoading: signal(isLoading),
      hasValue: signal(hasValue),
      reload: () => {},
    },
    seedDatabase: () => of({ success: true, message: 'Database seeded successfully' }),
    migrateDatabase: () => of({ success: true, message: 'Database migrated successfully' }),
    refreshStatus: () => {},
  };

  return [{ provide: AdminService, useValue: mockAdminService }];
}
