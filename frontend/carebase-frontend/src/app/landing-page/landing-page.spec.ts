import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { LandingPage } from './landing-page';
import { ActionCardHarness } from '../action-card/testing';
import { ActorSession } from '../services/actor-session';

@Component({ selector: 'stub-doctor', template: '<span>Doctor Workspace</span>' })
class StubDoctorComponent {}

@Component({ selector: 'stub-clerk', template: '<span>Clerk Workspace</span>' })
class StubClerkComponent {}

@Component({ selector: 'stub-admin', template: '<span>Admin Workspace</span>' })
class StubAdminComponent {}

describe('LandingPage', () => {
  let harness: RouterTestingHarness;
  let loader: HarnessLoader;
  let component: LandingPage;
  let session: ActorSession;
  let router: Router;

  beforeEach(async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
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
    loader = TestbedHarnessEnvironment.loader(harness.fixture);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all portal action cards with titles and descriptions', async () => {
    const cards = await loader.getAllHarnesses(ActionCardHarness);
    expect(cards.length).toBe(3);

    const titles = await Promise.all(cards.map((c) => c.getTitleText()));
    expect(titles).toEqual(['Doctor Portal', 'Hospital Clerk', 'System Administration']);

    const doctorCard = await loader.getHarness(ActionCardHarness.with({ title: 'Doctor Portal' }));
    expect(await doctorCard.getDescriptionText()).toContain(
      'Review patient consultation histories',
    );
  });

  it('should set role to doctor and navigate to /doctor when Doctor Portal action is triggered', async () => {
    const card = await loader.getHarness(ActionCardHarness.with({ title: 'Doctor Portal' }));
    await card.clickActionButton();
    await harness.fixture.whenStable();

    expect(session.role()).toBe('doctor');
    expect(router.url).toBe('/doctor');
    expect(harness.routeNativeElement?.textContent).toContain('Doctor Workspace');
  });

  it('should set role to clerk and navigate to /clerk when Hospital Clerk action is triggered', async () => {
    const card = await loader.getHarness(ActionCardHarness.with({ title: 'Hospital Clerk' }));
    await card.clickActionButton();
    await harness.fixture.whenStable();

    expect(session.role()).toBe('clerk');
    expect(router.url).toBe('/clerk');
    expect(harness.routeNativeElement?.textContent).toContain('Clerk Workspace');
  });

  it('should set role to admin and navigate to /admin when System Administration action is triggered', async () => {
    const card = await loader.getHarness(
      ActionCardHarness.with({ title: 'System Administration' }),
    );
    await card.clickActionButton();
    await harness.fixture.whenStable();

    expect(session.role()).toBe('admin');
    expect(router.url).toBe('/admin');
    expect(harness.routeNativeElement?.textContent).toContain('Admin Workspace');
  });
});
