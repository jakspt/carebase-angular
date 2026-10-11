import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DoctorPage } from './doctor-page';

describe('DoctorPage', () => {
  let component: DoctorPage;
  let fixture: ComponentFixture<DoctorPage>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [DoctorPage],
      providers: [provideRouter([])],
    });

    fixture = TestBed.createComponent(DoctorPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
