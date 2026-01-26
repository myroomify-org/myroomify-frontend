import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  url = "http://localhost:8000/api/me/"

  constructor(
    private http: HttpClient
  ){}

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      })
    };
  }

  getProfile$(){
    return this.http.get(this.url + "profile", this.getAuthHeaders())
  }

  editProfile$(data: any){
    return this.http.put(this.url + "profile", data, this.getAuthHeaders())
  }

  editEmail$(data: any){
    return this.http.put(this.url + "email", data, this.getAuthHeaders())
  }

  editPassword$(data: any){
    return this.http.put(this.url + "password", data, this.getAuthHeaders())
  }
}
