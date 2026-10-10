import { TestBed } from '@angular/core/testing';
import { ActorSession } from './actor-session';
import { Clerk, Doctor } from '../models/models';

describe('ActorSession (Ticket 01)', () => {
  let session: ActorSession;

  const mockClerk: Clerk = { id: '1001', name: 'Erika Mustermann', ssn: '1001' };
  const mockDoctor: Doctor = {
    id: '3011',
    name: 'Dr. Sarah Connor',
    ssn: '3011',
    specialty: 'Cardiology',
    position: 'Chief Doctor',
    department: 'Cardiology',
  };

  function createHydratedSession(): ActorSession {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ActorSession],
    });
    return TestBed.inject(ActorSession);
  }

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [ActorSession],
    });
    session = TestBed.inject(ActorSession);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Initial State', () => {
    it('should initialize unauthenticated with null actors when storage is empty', () => {
      expect(session.role()).toBeNull();
      expect(session.activeClerk()).toBeNull();
      expect(session.activeDoctor()).toBeNull();
      expect(session.isAuthenticated()).toBe(false);
    });
  });

  describe('Role Transitions & State Updates', () => {
    it('should set admin role and persist across rehydration', () => {
      session.setRole('admin');

      expect(session.role()).toBe('admin');
      expect(session.activeClerk()).toBeNull();
      expect(session.activeDoctor()).toBeNull();
      expect(session.isAuthenticated()).toBe(true);

      const hydrated = createHydratedSession();
      expect(hydrated.role()).toBe('admin');
      expect(hydrated.activeClerk()).toBeNull();
      expect(hydrated.activeDoctor()).toBeNull();
      expect(hydrated.isAuthenticated()).toBe(true);
    });

    it('should set doctor role with active doctor and persist across rehydration', () => {
      session.setRole('doctor', mockDoctor);

      expect(session.role()).toBe('doctor');
      expect(session.activeDoctor()).toEqual(mockDoctor);
      expect(session.activeClerk()).toBeNull();
      expect(session.isAuthenticated()).toBe(true);

      const hydrated = createHydratedSession();
      expect(hydrated.role()).toBe('doctor');
      expect(hydrated.activeDoctor()).toEqual(mockDoctor);
      expect(hydrated.isAuthenticated()).toBe(true);
    });

    it('should set clerk role with active clerk and persist across rehydration', () => {
      session.setRole('clerk', mockClerk);

      expect(session.role()).toBe('clerk');
      expect(session.activeClerk()).toEqual(mockClerk);
      expect(session.activeDoctor()).toBeNull();
      expect(session.isAuthenticated()).toBe(true);

      const hydrated = createHydratedSession();
      expect(hydrated.role()).toBe('clerk');
      expect(hydrated.activeClerk()).toEqual(mockClerk);
      expect(hydrated.isAuthenticated()).toBe(true);
    });

    it('should preserve active clerk when setRole is called with clerk and no actor argument', () => {
      session.setRole('clerk', mockClerk);
      expect(session.activeClerk()).toEqual(mockClerk);

      // Re-invoking clerk without actor argument must not wipe activeClerk
      session.setRole('clerk');
      expect(session.role()).toBe('clerk');
      expect(session.activeClerk()).toEqual(mockClerk);

      const hydrated = createHydratedSession();
      expect(hydrated.role()).toBe('clerk');
      expect(hydrated.activeClerk()).toEqual(mockClerk);
    });

    it('should support updating active clerk while retaining clerk role', () => {
      session.setRole('clerk');
      expect(session.role()).toBe('clerk');
      expect(session.activeClerk()).toBeNull();

      session.setActiveClerk(mockClerk);
      expect(session.role()).toBe('clerk');
      expect(session.activeClerk()).toEqual(mockClerk);

      let hydrated = createHydratedSession();
      expect(hydrated.role()).toBe('clerk');
      expect(hydrated.activeClerk()).toEqual(mockClerk);

      session.setActiveClerk(null);
      expect(session.role()).toBe('clerk');
      expect(session.activeClerk()).toBeNull();

      hydrated = createHydratedSession();
      expect(hydrated.role()).toBe('clerk');
      expect(hydrated.activeClerk()).toBeNull();
    });

    it('should support updating active doctor while retaining doctor role', () => {
      session.setRole('doctor');
      session.setActiveDoctor(mockDoctor);
      expect(session.role()).toBe('doctor');
      expect(session.activeDoctor()).toEqual(mockDoctor);

      const hydrated = createHydratedSession();
      expect(hydrated.role()).toBe('doctor');
      expect(hydrated.activeDoctor()).toEqual(mockDoctor);
    });
  });

  describe('Session Clearance', () => {
    it('should reset all signals and purge storage on clearSession()', () => {
      session.setRole('clerk', mockClerk);

      session.clearSession();

      expect(session.role()).toBeNull();
      expect(session.activeClerk()).toBeNull();
      expect(session.activeDoctor()).toBeNull();
      expect(session.isAuthenticated()).toBe(false);

      const hydrated = createHydratedSession();
      expect(hydrated.role()).toBeNull();
      expect(hydrated.activeClerk()).toBeNull();
      expect(hydrated.activeDoctor()).toBeNull();
      expect(hydrated.isAuthenticated()).toBe(false);
    });
  });

  describe('Hydration on Instantiation', () => {
    it('should hydrate clerk role and activeClerk across reload', () => {
      session.setRole('clerk', mockClerk);

      const reloadedSession = createHydratedSession();
      expect(reloadedSession.role()).toBe('clerk');
      expect(reloadedSession.activeClerk()).toEqual(mockClerk);
      expect(reloadedSession.activeDoctor()).toBeNull();
      expect(reloadedSession.isAuthenticated()).toBe(true);
    });

    it('should hydrate doctor role and activeDoctor across reload', () => {
      session.setRole('doctor', mockDoctor);

      const reloadedSession = createHydratedSession();
      expect(reloadedSession.role()).toBe('doctor');
      expect(reloadedSession.activeDoctor()).toEqual(mockDoctor);
      expect(reloadedSession.isAuthenticated()).toBe(true);
    });

    it('should hydrate admin role across reload', () => {
      session.setRole('admin');

      const reloadedSession = createHydratedSession();
      expect(reloadedSession.role()).toBe('admin');
      expect(reloadedSession.isAuthenticated()).toBe(true);
    });

    it('should handle corrupted JSON in storage gracefully', () => {
      sessionStorage.setItem('carebase_actor_session', 'INVALID_JSON{{{');

      const reloadedSession = createHydratedSession();
      expect(reloadedSession.role()).toBeNull();
      expect(reloadedSession.isAuthenticated()).toBe(false);
    });
  });

  describe('Storage Failure Fallbacks (SSR & Restricted Environments)', () => {
    it('should not throw if sessionStorage.setItem throws', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => {
        session.setRole('clerk', mockClerk);
      }).not.toThrow();

      // In-memory signals must still update
      expect(session.role()).toBe('clerk');
      expect(session.activeClerk()).toEqual(mockClerk);
      expect(session.isAuthenticated()).toBe(true);
    });

    it('should not throw if sessionStorage.removeItem throws on clearSession', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      session.setRole('admin');
      expect(() => {
        session.clearSession();
      }).not.toThrow();

      expect(session.role()).toBeNull();
      expect(session.isAuthenticated()).toBe(false);
    });
  });
});
