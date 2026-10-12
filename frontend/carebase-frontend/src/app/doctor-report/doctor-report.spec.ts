import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DoctorReport } from './doctor-report';
import { HOSPITAL_DATA_ACCESS } from '../services/hospital-data-access';
import { InMemoryHospitalDataAdapter } from '../services/in-memory-hospital-data-adapter';

describe('DoctorReport', () => {
  let component: DoctorReport;
  let fixture: ComponentFixture<DoctorReport>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [DoctorReport],
      providers: [{ provide: HOSPITAL_DATA_ACCESS, useClass: InMemoryHospitalDataAdapter }],
    });

    fixture = TestBed.createComponent(DoctorReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load earnings report data via InMemoryHospitalDataAdapter without HTTP mocking', async () => {
    component.selectedYear.set(2026);
    await fixture.whenStable();

    const data = component.reportData();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('totalCosts');
  });
});
