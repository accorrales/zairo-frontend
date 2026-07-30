import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

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

  if (userRole === 'entrada') {
    return router.createUrlTree(['/admin/kiosk']);
  }

  return router.createUrlTree(['/dashboard']);
};
