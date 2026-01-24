import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserBookingService {
  url = "http://localhost:8000/api/me/bookings/"

  constructor(
    private http: HttpClient
  ){}

  getHeaders$(){
    const token = localStorage.getItem('token')
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getBookings$(){
    return this.http.get(this.url, {headers: this.getHeaders$()})
  }

  addBooking$(data: any){
    return this.http.post(this.url, data, {headers: this.getHeaders$()})
  }
}
