import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { DoctorPage } from './doctor-page';
import { ActionCardHarness } from '../action-card/testing';

@Component({
  selector: 'stub-doctor-usecase',
  template: '<span>Record Clinical Treatment Workflow</span>',
})
class StubDoctorUseCaseComponent {}

@Component({
  selector: 'stub-doctor-report',
  template: '<span>Treatment Expenditure Analytics</span>',
})
class StubDoctorReportComponent {}

describe('DoctorPage', () => {
  let harness: RouterTestingHarness;
  let loader: HarnessLoader;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [DoctorPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([
          { path: 'doctor', component: DoctorPage },
          { path: 'doctor/usecase', component: StubDoctorUseCaseComponent },
          { path: 'doctor/report', component: StubDoctorReportComponent },
        ]),
      ],
    });

    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/doctor', DoctorPage);
    loader = TestbedHarnessEnvironment.loader(harness.fixture);
  });

  it('should render page header and doctor workstation action cards', async () => {
    const heading = harness.fixture.nativeElement.querySelector('.page-title');
    expect(heading?.textContent).toContain('Doctor Workstation');

    const subtitle = harness.fixture.nativeElement.querySelector('.page-subtitle');
    expect(subtitle?.textContent).toContain('Document patient encounters');

    const cards = await loader.getAllHarnesses(ActionCardHarness);
    expect(cards.length).toBe(2);
    expect(await cards[0].getTitleText()).toBe('Document Treatment');
    expect(await cards[1].getTitleText()).toBe('Treatment Expenditure Analytics');
  });

  it('should navigate to treatment documentation workflow when Record Treatment action is triggered', async () => {
    const card = await loader.getHarness(ActionCardHarness.with({ title: 'Document Treatment' }));
    await card.clickActionButton();
    await harness.fixture.whenStable();

    expect(router.url).toBe('/doctor/usecase');
    expect(harness.routeNativeElement?.textContent).toContain('Record Clinical Treatment Workflow');
  });

  it('should navigate to expenditure analytics report when View Cost Report action is triggered', async () => {
    const card = await loader.getHarness(
      ActionCardHarness.with({ title: 'Treatment Expenditure Analytics' }),
    );
    await card.clickActionButton();
    await harness.fixture.whenStable();

    expect(router.url).toBe('/doctor/report');
    expect(harness.routeNativeElement?.textContent).toContain('Treatment Expenditure Analytics');
  });
});
