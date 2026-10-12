import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { ClerkPage } from './clerk-page';
import { ActionCardHarness } from '../action-card/testing';

@Component({
  selector: 'stub-clerk-usecase',
  template: '<span>Appointment Intake Workflow</span>',
})
class StubClerkUseCaseComponent {}

@Component({
  selector: 'stub-clerk-report',
  template: '<span>Consultation Frequency Report</span>',
})
class StubClerkReportComponent {}

describe('ClerkPage', () => {
  let harness: RouterTestingHarness;
  let loader: HarnessLoader;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [ClerkPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([
          { path: 'clerk', component: ClerkPage },
          { path: 'clerk/usecase', component: StubClerkUseCaseComponent },
          { path: 'clerk/report', component: StubClerkReportComponent },
        ]),
      ],
    });

    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/clerk', ClerkPage);
    loader = TestbedHarnessEnvironment.loader(harness.fixture);
  });

  it('should render page header and administrative action cards', async () => {
    const heading = harness.fixture.nativeElement.querySelector('.page-title');
    expect(heading?.textContent).toContain('Hospital Clerk Workspace');

    const subtitle = harness.fixture.nativeElement.querySelector('.page-subtitle');
    expect(subtitle?.textContent).toContain('Coordinate patient intakes');

    const cards = await loader.getAllHarnesses(ActionCardHarness);
    expect(cards.length).toBe(2);
    expect(await cards[0].getTitleText()).toBe('Schedule Appointment');
    expect(await cards[1].getTitleText()).toBe('Visit Frequency Analytics');
  });

  it('should navigate to Appointment intake workflow when Schedule Appointment action is triggered', async () => {
    const card = await loader.getHarness(ActionCardHarness.with({ title: 'Schedule Appointment' }));
    await card.clickActionButton();
    await harness.fixture.whenStable();

    expect(router.url).toBe('/clerk/usecase');
    expect(harness.routeNativeElement?.textContent).toContain('Appointment Intake Workflow');
  });

  it('should navigate to Consultation Frequency Report when View Frequency Report action is triggered', async () => {
    const card = await loader.getHarness(
      ActionCardHarness.with({ title: 'Visit Frequency Analytics' }),
    );
    await card.clickActionButton();
    await harness.fixture.whenStable();

    expect(router.url).toBe('/clerk/report');
    expect(harness.routeNativeElement?.textContent).toContain('Consultation Frequency Report');
  });
});
