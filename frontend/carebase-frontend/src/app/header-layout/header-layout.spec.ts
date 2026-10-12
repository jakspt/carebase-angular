import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { HeaderLayout } from './header-layout';
import { ActorSession } from '../services/actor-session';
import { AdminService } from '../services/admin-service';

@Component({ selector: 'stub-home', template: '<span>Home</span>' })
class StubHomeComponent {}

describe('HeaderLayout', () => {
  let harness: RouterTestingHarness;
  let loader: HarnessLoader;
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
        provideNoopAnimations(),
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
    await harness.navigateByUrl('/doctor', HeaderLayout);
    loader = TestbedHarnessEnvironment.loader(harness.fixture);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should delegate role switching to administrator via MatMenuHarness and redirect to "/"', async () => {
    expect(router.url).toBe('/doctor');

    const menu = await loader.getHarness(MatMenuHarness);
    await menu.open();
    await menu.clickItem({ text: /System Administrator/ });
    await harness.fixture.whenStable();

    expect(session.role()).toBe('admin');
    expect(router.url).toBe('/');
    expect(harness.routeNativeElement?.textContent).toContain('Home');
  });

  it('should delegate role switching to hospital clerk via MatMenuHarness and redirect to "/"', async () => {
    expect(router.url).toBe('/doctor');

    const menu = await loader.getHarness(MatMenuHarness);
    await menu.open();
    await menu.clickItem({ text: /Hospital Clerk/ });
    await harness.fixture.whenStable();

    expect(session.role()).toBe('clerk');
    expect(router.url).toBe('/');
    expect(harness.routeNativeElement?.textContent).toContain('Home');
  });

  it('should clear session and redirect to "/" on logout via MatMenuHarness', async () => {
    expect(router.url).toBe('/doctor');

    const menu = await loader.getHarness(MatMenuHarness);
    await menu.open();
    await menu.clickItem({ text: /Sign out/ });
    await harness.fixture.whenStable();

    expect(session.role()).toBeNull();
    expect(router.url).toBe('/');
    expect(harness.routeNativeElement?.textContent).toContain('Home');
  });
});
