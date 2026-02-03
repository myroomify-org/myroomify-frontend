import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Login state
  private _isLoggedIn = new BehaviorSubject<boolean>(!!localStorage.getItem('token'))
  isLoggedIn$ = this._isLoggedIn.asObservable()

  // Current user
  private currentUserSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('user') || 'null'))
  public currentUser$ = this.currentUserSubject.asObservable()
  

  // Api
  registerApi = "http://localhost:8000/api/auth/register/"
  loginApi = "http://localhost:8000/api/auth/login/"
  verifyApi = "http://localhost:8000/api/auth/verify-email/"

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // Role
  getRole(): string {
    return this.currentUserSubject.value?.role || 'guest'
  }

  hasRole(allowedRoles: string[]): boolean {
    const userRole = this.getRole()
    return allowedRoles.includes(userRole)
  }

  // User methods
  register$(data: any){
    return this.http.post(this.registerApi, data)
  }

  login$(data: any) {
    return this.http.post(this.loginApi, data).pipe(
        tap((response: any) => {
          if (response.success && response.data) {
            const userData = response.data.user;
            const token = response.data.token;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            this.currentUserSubject.next(userData);
            this._isLoggedIn.next(true);
          }
        })
      )
  }

  logout$() {
    localStorage.removeItem('user')
    localStorage.removeItem('token')

    this.currentUserSubject.next(null)
    this._isLoggedIn.next(false)
    this.router.navigate(['/login'])
  }

  // Verification
  verifyEmail$(token: string) {
    return this.http.get(`${this.verifyApi}?token=${token}`)
  }
}
