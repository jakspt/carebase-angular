import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { HeaderLayout } from './header-layout';
import { ActorSession } from '../services/actor-session';
import { provideTestAdminService } from '../services/admin-service';

@Component({ selector: 'stub-home', template: '<span>Home</span>' })
class StubHomeComponent {}

describe('HeaderLayout', () => {
  let harness: RouterTestingHarness;
  let loader: HarnessLoader;
  let router: Router;
  let session: ActorSession;

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
        provideTestAdminService(),
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

  it('should render offline database status badge when provideTestAdminService defaults to offline', () => {
    const badge = harness.fixture.nativeElement.querySelector('.db-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Offline');
    expect(badge.classList.contains('mongo')).toBe(false);
  });
});

describe('HeaderLayout with configured AdminService status', () => {
  it('should render MongoDB badge and apply mongo class when dbType is MongoDB', async () => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideRouter([{ path: 'doctor', component: HeaderLayout }]),
        ActorSession,
        provideTestAdminService({ dbType: 'MongoDB' }),
      ],
    });

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/doctor', HeaderLayout);

    const badge = harness.fixture.nativeElement.querySelector('.db-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('MongoDB');
    expect(badge.classList.contains('mongo')).toBe(true);
  });

  it('should render Connecting status when isLoading is true', async () => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideRouter([{ path: 'doctor', component: HeaderLayout }]),
        ActorSession,
        provideTestAdminService({ isLoading: true }),
      ],
    });

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/doctor', HeaderLayout);

    const badge = harness.fixture.nativeElement.querySelector('.db-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Connecting...');
  });
});
