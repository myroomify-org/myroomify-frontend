import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth-service';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

export const guestGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService)
  const router = inject(Router)

  const currentUser = (auth as any)['currentUserSubject']?.value
  if (currentUser) {
    router.navigate(['/'])
    return false
  }

  const token = localStorage.getItem('token')
  if (!token) return true

  return auth.refreshProfile$().pipe(
    map((res: any) => {
      const user = (res && res.data) ? res.data : res
      if (user) {
        router.navigate(['/'])
        return false
      }
      return true
    }),
    catchError(() => of(true))
  )
}
