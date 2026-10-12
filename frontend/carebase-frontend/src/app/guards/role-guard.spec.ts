import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { createRoleGuard, homeRedirectGuard } from './role-guard';
import { ActorSession } from '../services/actor-session';

@Component({ selector: 'stub-home', template: '<span>Home</span>' })
class StubHomeComponent {}

@Component({ selector: 'stub-admin', template: '<span>Admin</span>' })
class StubAdminComponent {}

@Component({ selector: 'stub-doctor', template: '<span>Doctor</span>' })
class StubDoctorComponent {}

@Component({ selector: 'stub-clerk', template: '<span>Clerk</span>' })
class StubClerkComponent {}

@Component({ selector: 'stub-origin', template: '<span>Origin</span>' })
class StubOriginComponent {}

describe('Role Guards', () => {
  let session: ActorSession;

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Direct invocation', () => {
    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = {} as RouterStateSnapshot;

    beforeEach(() => {
      sessionStorage.clear();
      TestBed.configureTestingModule({
        providers: [provideRouter([]), ActorSession],
      });
      session = TestBed.inject(ActorSession);
    });

    describe('createRoleGuard', () => {
      describe('admin guard', () => {
        const adminGuard = createRoleGuard('admin');

        it('should allow access when actor role is admin', () => {
          session.setRole('admin');
          const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
          expect(result).toBe(true);
        });

        it('should redirect to root when actor role is doctor', () => {
          session.setRole('doctor');
          const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
          expect(result instanceof UrlTree).toBe(true);
          expect((result as UrlTree).toString()).toBe('/');
        });

        it('should redirect to root when actor role is clerk', () => {
          session.setRole('clerk');
          const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
          expect(result instanceof UrlTree).toBe(true);
          expect((result as UrlTree).toString()).toBe('/');
        });

        it('should redirect to root when unauthenticated (role is null)', () => {
          session.clearSession();
          const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
          expect(result instanceof UrlTree).toBe(true);
          expect((result as UrlTree).toString()).toBe('/');
        });
      });

      describe('doctor guard', () => {
        const doctorGuard = createRoleGuard('doctor');

        it('should allow access when actor role is doctor', () => {
          session.setRole('doctor');
          const result = TestBed.runInInjectionContext(() => doctorGuard(mockRoute, mockState));
          expect(result).toBe(true);
        });

        it('should redirect to root when actor role is admin', () => {
          session.setRole('admin');
          const result = TestBed.runInInjectionContext(() => doctorGuard(mockRoute, mockState));
          expect(result instanceof UrlTree).toBe(true);
          expect((result as UrlTree).toString()).toBe('/');
        });

        it('should redirect to root when unauthenticated', () => {
          session.clearSession();
          const result = TestBed.runInInjectionContext(() => doctorGuard(mockRoute, mockState));
          expect(result instanceof UrlTree).toBe(true);
          expect((result as UrlTree).toString()).toBe('/');
        });
      });

      describe('clerk guard', () => {
        const clerkGuard = createRoleGuard('clerk');

        it('should allow access when actor role is clerk', () => {
          session.setRole('clerk');
          const result = TestBed.runInInjectionContext(() => clerkGuard(mockRoute, mockState));
          expect(result).toBe(true);
        });

        it('should redirect to root when actor role is doctor', () => {
          session.setRole('doctor');
          const result = TestBed.runInInjectionContext(() => clerkGuard(mockRoute, mockState));
          expect(result instanceof UrlTree).toBe(true);
          expect((result as UrlTree).toString()).toBe('/');
        });

        it('should redirect to root when unauthenticated', () => {
          session.clearSession();
          const result = TestBed.runInInjectionContext(() => clerkGuard(mockRoute, mockState));
          expect(result instanceof UrlTree).toBe(true);
          expect((result as UrlTree).toString()).toBe('/');
        });
      });
    });

    describe('homeRedirectGuard', () => {
      it('should allow rendering landing page when session is unauthenticated', () => {
        session.clearSession();
        const result = TestBed.runInInjectionContext(() => homeRedirectGuard(mockRoute, mockState));
        expect(result).toBe(true);
      });

      it('should redirect to /admin when actor role is admin', () => {
        session.setRole('admin');
        const result = TestBed.runInInjectionContext(() => homeRedirectGuard(mockRoute, mockState));
        expect(result instanceof UrlTree).toBe(true);
        expect((result as UrlTree).toString()).toBe('/admin');
      });

      it('should redirect to /doctor when actor role is doctor', () => {
        session.setRole('doctor');
        const result = TestBed.runInInjectionContext(() => homeRedirectGuard(mockRoute, mockState));
        expect(result instanceof UrlTree).toBe(true);
        expect((result as UrlTree).toString()).toBe('/doctor');
      });

      it('should redirect to /clerk when actor role is clerk', () => {
        session.setRole('clerk');
        const result = TestBed.runInInjectionContext(() => homeRedirectGuard(mockRoute, mockState));
        expect(result instanceof UrlTree).toBe(true);
        expect((result as UrlTree).toString()).toBe('/clerk');
      });
    });
  });

  describe('createRoleGuard route-level integration', () => {
    let harness: RouterTestingHarness;
    let router: Router;

    beforeEach(async () => {
      sessionStorage.clear();
      TestBed.configureTestingModule({
        providers: [
          provideRouter([
            { path: '', component: StubHomeComponent },
            { path: 'origin', component: StubOriginComponent },
            {
              path: 'admin',
              component: StubAdminComponent,
              canActivate: [createRoleGuard('admin')],
            },
            {
              path: 'doctor',
              component: StubDoctorComponent,
              canActivate: [createRoleGuard('doctor')],
            },
            {
              path: 'clerk',
              component: StubClerkComponent,
              canActivate: [createRoleGuard('clerk')],
            },
          ]),
          ActorSession,
        ],
      });
      session = TestBed.inject(ActorSession);
      router = TestBed.inject(Router);
      harness = await RouterTestingHarness.create('/origin');
    });

    it('should allow access to /admin when actor role is admin', async () => {
      session.setRole('admin');
      await harness.navigateByUrl('/admin');
      expect(router.url).toBe('/admin');
      expect(harness.routeNativeElement?.textContent).toContain('Admin');
    });

    it.each([
      { role: 'doctor' as const, desc: 'doctor' },
      { role: 'clerk' as const, desc: 'clerk' },
      { role: null, desc: 'unauthenticated actor' },
    ])('should redirect unauthorized $desc accessing /admin to /', async ({ role }) => {
      if (role) {
        session.setRole(role);
      } else {
        session.clearSession();
      }
      expect(router.url).toBe('/origin');
      await harness.navigateByUrl('/admin');
      expect(router.url).toBe('/');
      expect(harness.routeNativeElement?.textContent).toContain('Home');
    });

    it('should allow access to /doctor when actor role is doctor', async () => {
      session.setRole('doctor');
      await harness.navigateByUrl('/doctor');
      expect(router.url).toBe('/doctor');
      expect(harness.routeNativeElement?.textContent).toContain('Doctor');
    });

    it.each([
      { role: 'admin' as const, desc: 'admin' },
      { role: 'clerk' as const, desc: 'clerk' },
      { role: null, desc: 'unauthenticated actor' },
    ])('should redirect unauthorized $desc accessing /doctor to /', async ({ role }) => {
      if (role) {
        session.setRole(role);
      } else {
        session.clearSession();
      }
      expect(router.url).toBe('/origin');
      await harness.navigateByUrl('/doctor');
      expect(router.url).toBe('/');
      expect(harness.routeNativeElement?.textContent).toContain('Home');
    });

    it('should allow access to /clerk when actor role is clerk', async () => {
      session.setRole('clerk');
      await harness.navigateByUrl('/clerk');
      expect(router.url).toBe('/clerk');
      expect(harness.routeNativeElement?.textContent).toContain('Clerk');
    });

    it.each([
      { role: 'admin' as const, desc: 'admin' },
      { role: 'doctor' as const, desc: 'doctor' },
      { role: null, desc: 'unauthenticated actor' },
    ])('should redirect unauthorized $desc accessing /clerk to /', async ({ role }) => {
      if (role) {
        session.setRole(role);
      } else {
        session.clearSession();
      }
      expect(router.url).toBe('/origin');
      await harness.navigateByUrl('/clerk');
      expect(router.url).toBe('/');
      expect(harness.routeNativeElement?.textContent).toContain('Home');
    });
  });

  describe('homeRedirectGuard route-level integration', () => {
    let harness: RouterTestingHarness;
    let router: Router;

    beforeEach(async () => {
      sessionStorage.clear();
      TestBed.configureTestingModule({
        providers: [
          provideRouter([
            { path: '', component: StubHomeComponent, canActivate: [homeRedirectGuard] },
            { path: 'admin', component: StubAdminComponent },
            { path: 'doctor', component: StubDoctorComponent },
            { path: 'clerk', component: StubClerkComponent },
          ]),
          ActorSession,
        ],
      });
      session = TestBed.inject(ActorSession);
      router = TestBed.inject(Router);
      harness = await RouterTestingHarness.create();
    });

    it('should allow rendering landing page at / when session is unauthenticated', async () => {
      session.clearSession();
      await harness.navigateByUrl('/');
      expect(router.url).toBe('/');
      expect(harness.routeNativeElement?.textContent).toContain('Home');
    });

    it.each([
      { role: 'admin' as const, dest: '/admin', label: 'Admin' },
      { role: 'doctor' as const, dest: '/doctor', label: 'Doctor' },
      { role: 'clerk' as const, dest: '/clerk', label: 'Clerk' },
    ])('should redirect / to $dest when actor role is $role', async ({ role, dest, label }) => {
      session.setRole(role);
      await harness.navigateByUrl('/');
      expect(router.url).toBe(dest);
      expect(harness.routeNativeElement?.textContent).toContain(label);
    });
  });
});
