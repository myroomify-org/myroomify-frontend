import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MeProfileService {
  // Api
  url = environment.apiHost + "/me";

  constructor(
    private http: HttpClient
  ){}

  // Get token
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      })
    };
  }

  // Get
  getProfile$(){
    return this.http.get(`${this.url}/profile`, this.getAuthHeaders())
  }

  // Edit
  editProfile$(data: any){
    return this.http.put(`${this.url}/profile`, data, this.getAuthHeaders())
  }

  editEmail$(data: any){
    return this.http.put(`${this.url}/email`, data, this.getAuthHeaders())
  }

  editPassword$(data: any){
    return this.http.put(`${this.url}/password`, data, this.getAuthHeaders())
  }
}
