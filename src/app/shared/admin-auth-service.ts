import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminAuthService {
  private _isLoggedIn = new BehaviorSubject(false)
  isLoggedIn$ = this._isLoggedIn.asObservable()

  private currentUserSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  public currentUser$ = this.currentUserSubject.asObservable();

  //Api
  registerApi = "http://localhost:8000/api/auth/register/"
  loginApi = "http://localhost:8000/api/auth/login/"

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  loginSuccess(){
    this._isLoggedIn.next(true)
  }
  logout(){
    this._isLoggedIn.next(false)
  }

  register$(data: any){
    return this.http.post(this.registerApi, data)
  }

  login$(data: any){
    return this.http.post(this.loginApi, data).pipe(
      tap((response: any) => {
        if (response.success && response.data) {
          const userData = response.data.user
          const token = response.data.token

          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(userData))

          this.currentUserSubject.next(response.data.user)
        }
      })
    );
  }

  logout$() {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    this.currentUserSubject.next(null)
    this.router.navigate(['/login'])
  }
}
