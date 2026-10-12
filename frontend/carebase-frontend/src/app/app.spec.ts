import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatToolbarHarness } from '@angular/material/toolbar/testing';
import { App } from './app';
import { HeaderLayout } from './header-layout/header-layout';
import { ActorSession } from './services/actor-session';
import { provideTestAdminService } from './services/admin-service';

@Component({ selector: 'stub-child', template: '<p>Child Content</p>' })
class StubChildComponent {}

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideNoopAnimations(),
        provideRouter([
          {
            path: '',
            component: HeaderLayout,
            children: [{ path: '', component: StubChildComponent }],
          },
        ]),
        ActorSession,
        provideTestAdminService(),
      ],
    });
  });

  it('renders application shell navigation outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    expect(fixture.componentInstance).toBeTruthy();
    const routerOutlet = fixture.nativeElement.querySelector('router-outlet');
    expect(routerOutlet).toBeTruthy();
  });

  it('renders application shell and header layout in the DOM upon initial navigation', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);
    await router.initialNavigation();
    await fixture.whenStable();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const toolbar = await loader.getHarness(MatToolbarHarness);
    expect(toolbar).toBeTruthy();

    const headerLayout = fixture.nativeElement.querySelector('app-header-layout');
    expect(headerLayout).toBeTruthy();
  });
});
