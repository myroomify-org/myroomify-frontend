import { inject } from '@angular/core';
import { AuthService } from './auth-service';
import { Router, CanActivateFn } from '@angular/router';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService)
  const router = inject(Router)

  const expectedRoles = route.data['roles'] as string[]

  const currentRole = (authService as any)['currentUserSubject']?.value?.role
  if (currentRole) {
    if (expectedRoles.includes(currentRole)) return true
    router.navigate(['/'])
    return false
  }

  const token = localStorage.getItem('token')
  if (!token) {
    router.navigate(['/login'])
    return false
  }

  return authService.refreshProfile$().pipe(
    map((response: any) => {
      const user = (response && response.data) ? response.data : response
      const role = user?.role || 'guest'
      if (expectedRoles.includes(role)) return true
      router.navigate(['/'])
      return false
    }),
    catchError(() => {
      router.navigate(['/login'])
      return of(false)
    })
  )
}
