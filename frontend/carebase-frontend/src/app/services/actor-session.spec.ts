import { TestBed } from '@angular/core/testing';
import { ActorSession, ActorRole } from './actor-session';
import { Clerk, Doctor } from '../models/models';

describe('ActorSession (Ticket 01)', () => {
  let session: ActorSession;

  const mockClerk: Clerk = { id: '1001', name: 'Erika Mustermann', ssn: '1001' };
  const mockDoctor: Doctor = {
    id: '3011',
    name: 'Dr. Sarah Connor',
    ssn: '3011',
    specialty: 'Cardiology',
    position: 'Chief Physician',
    department: 'Cardiology',
  };

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
    it('should set admin role and persist to sessionStorage', () => {
      session.setRole('admin');

      expect(session.role()).toBe('admin');
      expect(session.activeClerk()).toBeNull();
      expect(session.activeDoctor()).toBeNull();
      expect(session.isAuthenticated()).toBe(true);

      const raw = sessionStorage.getItem('carebase_actor_session');
      expect(raw).toBeTruthy();
      const stored = JSON.parse(raw!);
      expect(stored.role).toBe('admin');
      expect(stored.activeClerk).toBeNull();
      expect(stored.activeDoctor).toBeNull();
    });

    it('should set doctor role with active doctor and persist', () => {
      session.setRole('doctor', mockDoctor);

      expect(session.role()).toBe('doctor');
      expect(session.activeDoctor()).toEqual(mockDoctor);
      expect(session.activeClerk()).toBeNull();
      expect(session.isAuthenticated()).toBe(true);

      const stored = JSON.parse(sessionStorage.getItem('carebase_actor_session')!);
      expect(stored.role).toBe('doctor');
      expect(stored.activeDoctor).toEqual(mockDoctor);
    });

    it('should set clerk role with active clerk and persist', () => {
      session.setRole('clerk', mockClerk);

      expect(session.role()).toBe('clerk');
      expect(session.activeClerk()).toEqual(mockClerk);
      expect(session.activeDoctor()).toBeNull();
      expect(session.isAuthenticated()).toBe(true);

      const stored = JSON.parse(sessionStorage.getItem('carebase_actor_session')!);
      expect(stored.role).toBe('clerk');
      expect(stored.activeClerk).toEqual(mockClerk);
    });

    it('should support updating active clerk while retaining clerk role', () => {
      session.setRole('clerk');
      expect(session.role()).toBe('clerk');
      expect(session.activeClerk()).toBeNull();

      session.setActiveClerk(mockClerk);
      expect(session.activeClerk()).toEqual(mockClerk);

      const stored = JSON.parse(sessionStorage.getItem('carebase_actor_session')!);
      expect(stored.activeClerk).toEqual(mockClerk);

      session.setActiveClerk(null);
      expect(session.activeClerk()).toBeNull();
      const storedAfter = JSON.parse(sessionStorage.getItem('carebase_actor_session')!);
      expect(storedAfter.activeClerk).toBeNull();
    });

    it('should support updating active doctor while retaining doctor role', () => {
      session.setRole('doctor');
      session.setActiveDoctor(mockDoctor);
      expect(session.activeDoctor()).toEqual(mockDoctor);

      const stored = JSON.parse(sessionStorage.getItem('carebase_actor_session')!);
      expect(stored.activeDoctor).toEqual(mockDoctor);
    });
  });

  describe('Session Clearance', () => {
    it('should reset all signals and purge storage on clearSession()', () => {
      session.setRole('clerk', mockClerk);
      sessionStorage.setItem('carebase_active_clerk', JSON.stringify(mockClerk));

      session.clearSession();

      expect(session.role()).toBeNull();
      expect(session.activeClerk()).toBeNull();
      expect(session.activeDoctor()).toBeNull();
      expect(session.isAuthenticated()).toBe(false);

      expect(sessionStorage.getItem('carebase_actor_session')).toBeNull();
      expect(sessionStorage.getItem('carebase_active_clerk')).toBeNull();
    });
  });

  describe('Hydration on Instantiation', () => {
    it('should hydrate clerk role and activeClerk from existing sessionStorage', () => {
      sessionStorage.setItem(
        'carebase_actor_session',
        JSON.stringify({
          role: 'clerk',
          activeClerk: mockClerk,
          activeDoctor: null,
        }),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [ActorSession],
      });
      const reloadedSession = TestBed.inject(ActorSession);

      expect(reloadedSession.role()).toBe('clerk');
      expect(reloadedSession.activeClerk()).toEqual(mockClerk);
      expect(reloadedSession.activeDoctor()).toBeNull();
      expect(reloadedSession.isAuthenticated()).toBe(true);
    });

    it('should hydrate doctor role and activeDoctor from existing sessionStorage', () => {
      sessionStorage.setItem(
        'carebase_actor_session',
        JSON.stringify({
          role: 'doctor',
          activeClerk: null,
          activeDoctor: mockDoctor,
        }),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [ActorSession],
      });
      const reloadedSession = TestBed.inject(ActorSession);

      expect(reloadedSession.role()).toBe('doctor');
      expect(reloadedSession.activeDoctor()).toEqual(mockDoctor);
      expect(reloadedSession.isAuthenticated()).toBe(true);
    });

    it('should hydrate admin role from existing sessionStorage', () => {
      sessionStorage.setItem(
        'carebase_actor_session',
        JSON.stringify({
          role: 'admin',
          activeClerk: null,
          activeDoctor: null,
        }),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [ActorSession],
      });
      const reloadedSession = TestBed.inject(ActorSession);

      expect(reloadedSession.role()).toBe('admin');
      expect(reloadedSession.isAuthenticated()).toBe(true);
    });

    it('should handle corrupted JSON in sessionStorage gracefully', () => {
      sessionStorage.setItem('carebase_actor_session', 'INVALID_JSON{{{');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [ActorSession],
      });
      const reloadedSession = TestBed.inject(ActorSession);

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
