import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { createRoleGuard, homeRedirectGuard } from './role-guard';
import { ActorSession } from '../services/actor-session';

describe('Role Guards (Ticket 02)', () => {
  let session: ActorSession;
  let router: Router;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), ActorSession],
    });
    session = TestBed.inject(ActorSession);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    sessionStorage.clear();
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
