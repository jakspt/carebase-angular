import { TestBed } from '@angular/core/testing';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { HOSPITAL_DATA_ACCESS } from './services/hospital-data-access';
import {
  IN_MEMORY_ADAPTER_CONFIG,
  InMemoryHospitalDataAdapter,
} from './services/in-memory-hospital-data-adapter';
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

  it('provides simulated delays and demo fixture mode for static demo environment in IN_MEMORY_ADAPTER_CONFIG', () => {
    const config = TestBed.inject(IN_MEMORY_ADAPTER_CONFIG);
    expect(config).toEqual({
      seedDelayMs: 3000,
      migrateDelayMs: 10000,
      fixtureMode: 'demo',
    });
  });
});
