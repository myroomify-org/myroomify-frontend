import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth-service';
import { Router, CanActivateFn } from '@angular/router';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService)
  const router = inject(Router)

  const expectedRoles = route.data['roles'] as string[]

  if (authService.hasRole(expectedRoles)) {
    return true
  }

  router.navigate(['/admin/bookings']);
  return false
}
