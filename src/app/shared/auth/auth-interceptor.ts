import { HttpInterceptorFn } from '@angular/common/http';

export const AuthInterceptor: HttpInterceptorFn = (request, next) => {
  const token = localStorage.getItem('token')

  if (token) {
    const cloned = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
    return next(cloned)
  }
  return next(request)
}