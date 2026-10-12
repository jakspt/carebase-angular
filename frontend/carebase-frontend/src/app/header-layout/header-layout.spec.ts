import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { HeaderLayout } from './header-layout';
import { ActorSession } from '../services/actor-session';
import { AdminService } from '../services/admin-service';

@Component({ selector: 'stub-home', template: '<span>Home</span>' })
class StubHomeComponent {}

describe('HeaderLayout', () => {
  let harness: RouterTestingHarness;
  let component: HeaderLayout;
  let router: Router;
  let session: ActorSession;

  const mockAdminService = {
    statusResource: {
      value: signal(undefined),
      isLoading: signal(false),
      hasValue: signal(false),
    },
  };

  beforeEach(async () => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: StubHomeComponent },
          { path: 'doctor', component: HeaderLayout },
        ]),
        ActorSession,
        { provide: AdminService, useValue: mockAdminService },
      ],
    });

    session = TestBed.inject(ActorSession);
    session.setRole('doctor');
    router = TestBed.inject(Router);

    harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/doctor', HeaderLayout);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should delegate role switching and redirect to "/"', async () => {
    expect(router.url).toBe('/doctor');

    component.switchRole('admin');
    await harness.fixture.whenStable();

    expect(session.role()).toBe('admin');
    expect(router.url).toBe('/');
    expect(harness.routeNativeElement?.textContent).toContain('Home');
  });

  it('should clear session and redirect to "/" on logout', async () => {
    expect(router.url).toBe('/doctor');

    component.logout();
    await harness.fixture.whenStable();

    expect(session.role()).toBeNull();
    expect(router.url).toBe('/');
    expect(harness.routeNativeElement?.textContent).toContain('Home');
  });
});
