import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { MatToolbarHarness } from '@angular/material/toolbar/testing';
import { HeaderLayout } from './header-layout';
import {
  ActorSession,
  TestHospitalDataOptions,
  provideTestHospitalData,
} from '../services';

@Component({ selector: 'stub-home', template: '<span>Home</span>' })
class StubHomeComponent {}

async function createHeaderHarness(options?: TestHospitalDataOptions) {
  sessionStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideNoopAnimations(),
      provideRouter([{ path: 'doctor', component: HeaderLayout }]),
      ActorSession,
      provideTestHospitalData(options),
    ],
  });
  const customHarness = await RouterTestingHarness.create();
  await customHarness.navigateByUrl('/doctor', HeaderLayout);
  const customLoader = TestbedHarnessEnvironment.loader(customHarness.fixture);
  const customToolbar = await customLoader.getHarness(MatToolbarHarness);
  return { harness: customHarness, toolbar: customToolbar };
}

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
        provideTestHospitalData(),
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

  it('should render MariaDB database status badge in toolbar by default', async () => {
    const toolbar = await loader.getHarness(MatToolbarHarness);
    const text = await (await toolbar.host()).text();
    expect(text).toContain('MariaDB');
  });
});

describe('HeaderLayout with configured database status', () => {
  it('should render MongoDB badge in toolbar when dbType is MongoDB', async () => {
    const { toolbar } = await createHeaderHarness({ dbType: 'MongoDB' });
    const text = await (await toolbar.host()).text();
    expect(text).toContain('MongoDB');
  });

  it('should render Connecting status in toolbar when isLoading is true', async () => {
    const { toolbar } = await createHeaderHarness({ isLoading: true });
    const text = await (await toolbar.host()).text();
    expect(text).toContain('Connecting...');
  });

  it('should render Offline status in toolbar when dbType is null', async () => {
    const { toolbar } = await createHeaderHarness({ dbType: null });
    const text = await (await toolbar.host()).text();
    expect(text).toContain('Offline');
  });
});
