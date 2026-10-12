import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ClerkPage } from './clerk-page';

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
  });

  it('should render page header and administrative action cards', () => {
    const heading = harness.fixture.nativeElement.querySelector('.page-title');
    expect(heading?.textContent).toContain('Hospital Clerk Workspace');

    const subtitle = harness.fixture.nativeElement.querySelector('.page-subtitle');
    expect(subtitle?.textContent).toContain('Coordinate patient intakes');
  });

  it('should navigate to Appointment intake workflow when Schedule Appointment action is triggered', async () => {
    const actionButtons = harness.fixture.nativeElement.querySelectorAll('.action-btn');
    expect(actionButtons.length).toBe(2);

    actionButtons[0].click();
    await harness.fixture.whenStable();

    expect(router.url).toBe('/clerk/usecase');
    expect(harness.routeNativeElement?.textContent).toContain('Appointment Intake Workflow');
  });

  it('should navigate to Consultation Frequency Report when View Frequency Report action is triggered', async () => {
    const actionButtons = harness.fixture.nativeElement.querySelectorAll('.action-btn');
    expect(actionButtons.length).toBe(2);

    actionButtons[1].click();
    await harness.fixture.whenStable();

    expect(router.url).toBe('/clerk/report');
    expect(harness.routeNativeElement?.textContent).toContain('Consultation Frequency Report');
  });
});
