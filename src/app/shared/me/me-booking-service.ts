import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MeBookingService {
  // Api
  url = environment.apiHost + '/me/bookings'

  constructor(
    private http: HttpClient
  ){}

  // Token
  getHeaders$(){
    const token = localStorage.getItem('token')
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    })
  }

  // Get
  getBookings$(){
    return this.http.get(this.url, {headers: this.getHeaders$()})
  }

  getBooking$(id: number){
    return this.http.get(`${this.url}/${id}`, {headers: this.getHeaders$()})
  }

  // Add
  addBooking$(data: any){
    return this.http.post(this.url, data, {headers: this.getHeaders$()})
  }

  // Edit
  editBooking$(id:number, data: any){
    return this.http.put(`${this.url}/${id}`, data, {headers: this.getHeaders$()})
  }

  cancelBooking$(id: number){
    return this.http.post(`${this.url}/${id}/cancel`, {}, {headers: this.getHeaders$()})
  }
}
