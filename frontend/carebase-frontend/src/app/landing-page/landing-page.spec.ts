import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { LandingPage } from './landing-page';
import { ActorSession } from '../services/actor-session';

@Component({ selector: 'stub-doctor', template: '<span>Doctor Workspace</span>' })
class StubDoctorComponent {}

@Component({ selector: 'stub-clerk', template: '<span>Clerk Workspace</span>' })
class StubClerkComponent {}

@Component({ selector: 'stub-admin', template: '<span>Admin Workspace</span>' })
class StubAdminComponent {}

describe('LandingPage', () => {
  let harness: RouterTestingHarness;
  let component: LandingPage;
  let session: ActorSession;
  let router: Router;

  beforeEach(async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: LandingPage },
          { path: 'doctor', component: StubDoctorComponent },
          { path: 'clerk', component: StubClerkComponent },
          { path: 'admin', component: StubAdminComponent },
        ]),
        ActorSession,
      ],
    });

    session = TestBed.inject(ActorSession);
    router = TestBed.inject(Router);

    harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/', LandingPage);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set role to doctor and navigate on visitDoctorSite()', async () => {
    component.visitDoctorSite();
    await harness.fixture.whenStable();
    expect(session.role()).toBe('doctor');
    expect(router.url).toBe('/doctor');
    expect(harness.routeNativeElement?.textContent).toContain('Doctor Workspace');
  });

  it('should set role to clerk and navigate on visitClerkSite()', async () => {
    component.visitClerkSite();
    await harness.fixture.whenStable();
    expect(session.role()).toBe('clerk');
    expect(router.url).toBe('/clerk');
    expect(harness.routeNativeElement?.textContent).toContain('Clerk Workspace');
  });

  it('should set role to admin and navigate on visitAdminSite()', async () => {
    component.visitAdminSite();
    await harness.fixture.whenStable();
    expect(session.role()).toBe('admin');
    expect(router.url).toBe('/admin');
    expect(harness.routeNativeElement?.textContent).toContain('Admin Workspace');
  });
});
