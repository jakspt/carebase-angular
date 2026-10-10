import { Injectable, computed, signal, Signal } from '@angular/core';
import { Clerk, Doctor } from '../models/models';

export type ActorRole = 'admin' | 'doctor' | 'clerk';

export interface ActorSessionState {
  role: ActorRole | null;
  activeClerk: Clerk | null;
  activeDoctor: Doctor | null;
}

export const SESSION_STORAGE_KEY = 'carebase_actor_session';
const LEGACY_CLERK_KEY = 'carebase_active_clerk';

@Injectable({
  providedIn: 'root',
})
export class ActorSession {
  private readonly _role = signal<ActorRole | null>(null);
  private readonly _activeClerk = signal<Clerk | null>(null);
  private readonly _activeDoctor = signal<Doctor | null>(null);

  readonly role: Signal<ActorRole | null> = this._role.asReadonly();
  readonly activeClerk: Signal<Clerk | null> = this._activeClerk.asReadonly();
  readonly activeDoctor: Signal<Doctor | null> = this._activeDoctor.asReadonly();
  readonly isAuthenticated: Signal<boolean> = computed(() => this._role() !== null);

  constructor() {
    this.hydrate();
  }

  setRole(role: ActorRole, actor?: Clerk | Doctor | null): void {
    let nextClerk: Clerk | null = null;
    let nextDoctor: Doctor | null = null;

    if (role === 'clerk') {
      nextClerk = (actor as Clerk) ?? null;
    } else if (role === 'doctor') {
      nextDoctor = (actor as Doctor) ?? null;
    }

    this._role.set(role);
    this._activeClerk.set(nextClerk);
    this._activeDoctor.set(nextDoctor);

    this.persist();
  }

  setActiveClerk(clerk: Clerk | null): void {
    this._activeClerk.set(clerk);
    this.persist();
  }

  setActiveDoctor(doctor: Doctor | null): void {
    this._activeDoctor.set(doctor);
    this.persist();
  }

  clearSession(): void {
    this._role.set(null);
    this._activeClerk.set(null);
    this._activeDoctor.set(null);

    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
        window.sessionStorage.removeItem(LEGACY_CLERK_KEY);
      }
    } catch {
      // Ignore storage errors in SSR or restricted environments
    }
  }

  private hydrate(): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<ActorSessionState>;
          if (
            parsed &&
            (parsed.role === 'admin' || parsed.role === 'doctor' || parsed.role === 'clerk')
          ) {
            this._role.set(parsed.role);
            this._activeClerk.set(parsed.activeClerk ?? null);
            this._activeDoctor.set(parsed.activeDoctor ?? null);
            return;
          }
        }
      }
    } catch {
      // In SSR or restricted environments, fallback silently to default null state
    }
  }

  private persist(): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const state: ActorSessionState = {
          role: this._role(),
          activeClerk: this._activeClerk(),
          activeDoctor: this._activeDoctor(),
        };
        window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
      }
    } catch {
      // Ignore storage errors in SSR or restricted environments
    }
  }
}
