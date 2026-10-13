import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { roleHome } from './role-home';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = ((route.data?.['roles'] as string[]) || [])
    .map((role) => role.toLowerCase().trim());

  const userRole = authService.getRole()?.toLowerCase().trim();

  if (allowedRoles.length === 0) {
    return true;
  }

  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  const destination = roleHome(userRole);
  // Never redirect a denied route back to itself.
  return router.createUrlTree([destination === `/${route.routeConfig?.path}` ? '/home' : destination]);
};
