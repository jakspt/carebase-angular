import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ActorRole, ActorSession } from '../services/actor-session';

export function createRoleGuard(requiredRole: ActorRole): CanActivateFn {
  return () => {
    const session = inject(ActorSession);
    const router = inject(Router);

    if (session.role() === requiredRole) {
      return true;
    }

    return router.createUrlTree(['/']);
  };
}

export const homeRedirectGuard: CanActivateFn = () => {
  const session = inject(ActorSession);
  const router = inject(Router);
  const role = session.role();

  switch (role) {
    case 'admin':
      return router.createUrlTree(['/admin']);
    case 'doctor':
      return router.createUrlTree(['/doctor']);
    case 'clerk':
      return router.createUrlTree(['/clerk']);
    default:
      return true;
  }
};
