import { TestBed } from '@angular/core/testing';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import {
  CLINICAL_DATA_ACCESS,
  HOSPITAL_DATA_ACCESS,
  IN_MEMORY_ADAPTER_CONFIG,
  InMemoryHospitalDataAdapter,
  REPORTING_DATA_ACCESS,
  SCHEDULING_DATA_ACCESS,
  SYSTEM_DATA_ACCESS,
} from './services';
import { appConfig } from './app.config.static';

describe('appConfig (static)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [appConfig.providers],
    });
  });

  it('configures client-side hash location routing', () => {
    const locationStrategy = TestBed.inject(LocationStrategy);
    expect(locationStrategy).toBeInstanceOf(HashLocationStrategy);
  });

  it('binds HOSPITAL_DATA_ACCESS to InMemoryHospitalDataAdapter', () => {
    const dataAccess = TestBed.inject(HOSPITAL_DATA_ACCESS);
    expect(dataAccess).toBeInstanceOf(InMemoryHospitalDataAdapter);
  });

  it('aliases capability tokens to the shared InMemoryHospitalDataAdapter', () => {
    const master = TestBed.inject(HOSPITAL_DATA_ACCESS);
    expect(TestBed.inject(SCHEDULING_DATA_ACCESS)).toBe(master);
    expect(TestBed.inject(CLINICAL_DATA_ACCESS)).toBe(master);
    expect(TestBed.inject(REPORTING_DATA_ACCESS)).toBe(master);
    expect(TestBed.inject(SYSTEM_DATA_ACCESS)).toBe(master);
  });

  it('provides simulated delays and demo fixture mode for static demo environment in IN_MEMORY_ADAPTER_CONFIG', () => {
    const config = TestBed.inject(IN_MEMORY_ADAPTER_CONFIG);
    expect(config).toEqual({
      seedDelayMs: 3000,
      migrateDelayMs: 10000,
      fixtureMode: 'demo',
    });
  });
});
