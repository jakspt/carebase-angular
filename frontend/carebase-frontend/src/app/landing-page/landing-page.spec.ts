import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { LandingPage } from './landing-page';
import { ActorSession } from '../services/actor-session';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

describe('LandingPage (Ticket 03)', () => {
  let component: LandingPage;
  let fixture: ComponentFixture<LandingPage>;
  let session: ActorSession;
  let router: Router;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [LandingPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), ActorSession],
    });

    session = TestBed.inject(ActorSession);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(LandingPage);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set role to doctor and navigate on visitDoctorSite()', () => {
    component.visitDoctorSite();
    expect(session.role()).toBe('doctor');
    expect(router.navigate).toHaveBeenCalledWith(['doctor']);
  });

  it('should set role to clerk and navigate on visitClerkSite()', () => {
    component.visitClerkSite();
    expect(session.role()).toBe('clerk');
    expect(router.navigate).toHaveBeenCalledWith(['clerk']);
  });

  it('should set role to admin and navigate on visitAdminSite()', () => {
    component.visitAdminSite();
    expect(session.role()).toBe('admin');
    expect(router.navigate).toHaveBeenCalledWith(['admin']);
  });
});
