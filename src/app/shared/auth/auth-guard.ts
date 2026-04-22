import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth-service';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService)
  const router = inject(Router)

  const token = localStorage.getItem('token')

  if (!token) {
    router.navigate(['/login'])
    return false
  }

  if (auth['currentUserSubject']?.value) {
    return true
  }

  return auth.refreshProfile$().pipe(
    map(() => true),
    catchError(() => {
      router.navigate(['/login'])
      return of(false)
    })
  )
}
