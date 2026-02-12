import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MeBookingService {
  // Api
  url = "http://localhost:8000/api/me/bookings/"

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

  getBooking$(){
    return this.http.get(this.url, {headers: this.getHeaders$()})
  }

  // Add
  addBooking$(data: any){
    return this.http.post(this.url, data, {headers: this.getHeaders$()})
  }

  // Edit
  editBooking$(id:number, data: any){
    return this.http.put(this.url + id, data, {headers: this.getHeaders$()})
  }

  cancelBooking$(id: number){
    return this.http.put(this.url + id + "/cancel", {headers: this.getHeaders$()})
  }
}
