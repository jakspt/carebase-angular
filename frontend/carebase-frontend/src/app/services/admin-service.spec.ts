import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AdminService, provideTestAdminService } from './admin-service';

describe('provideTestAdminService', () => {
  it('should provide AdminService with default initial signals (offline/empty state)', () => {
    TestBed.configureTestingModule({
      providers: [provideTestAdminService()],
    });

    const adminService = TestBed.inject(AdminService);
    expect(adminService).toBeTruthy();
    expect(adminService.statusResource.value()).toBeUndefined();
    expect(adminService.statusResource.isLoading()).toBe(false);
    expect(adminService.statusResource.hasValue()).toBe(false);
  });

  it('should configure statusResource with connected MariaDB status when dbType is MariaDB', () => {
    TestBed.configureTestingModule({
      providers: [provideTestAdminService({ dbType: 'MariaDB' })],
    });

    const adminService = TestBed.inject(AdminService);
    expect(adminService.statusResource.hasValue()).toBe(true);
    expect(adminService.statusResource.isLoading()).toBe(false);
    expect(adminService.statusResource.value()).toEqual({ dbType: 'MariaDB' });
  });

  it('should configure statusResource with connected MongoDB status when dbType is MongoDB', () => {
    TestBed.configureTestingModule({
      providers: [provideTestAdminService({ dbType: 'MongoDB' })],
    });

    const adminService = TestBed.inject(AdminService);
    expect(adminService.statusResource.hasValue()).toBe(true);
    expect(adminService.statusResource.isLoading()).toBe(false);
    expect(adminService.statusResource.value()).toEqual({ dbType: 'MongoDB' });
  });

  it('should support explicit isLoading and hasValue overrides', () => {
    TestBed.configureTestingModule({
      providers: [provideTestAdminService({ isLoading: true, hasValue: false })],
    });

    const adminService = TestBed.inject(AdminService);
    expect(adminService.statusResource.isLoading()).toBe(true);
    expect(adminService.statusResource.hasValue()).toBe(false);
    expect(adminService.statusResource.value()).toBeUndefined();
  });

  it('should provide callable seedDatabase, migrateDatabase, and refreshStatus stubs', async () => {
    TestBed.configureTestingModule({
      providers: [provideTestAdminService()],
    });

    const adminService = TestBed.inject(AdminService);
    expect(() => adminService.refreshStatus()).not.toThrow();
    expect(() => adminService.statusResource.reload()).not.toThrow();

    const seedResult = await firstValueFrom(adminService.seedDatabase());
    expect(seedResult.success).toBe(true);

    const migrateResult = await firstValueFrom(adminService.migrateDatabase());
    expect(migrateResult.success).toBe(true);
  });
});
