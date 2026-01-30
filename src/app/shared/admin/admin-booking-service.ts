import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AdminBookingService {
  //Api
  url = "http://localhost:8000/api/admin/bookings/"

  constructor(
    private http: HttpClient
  ){}

  // Get
  getBookings$(){
    return this.http.get(this.url)
  }

  getBooking$(id: number){
    return this.http.get(this.url + id)
  }

  // Add
  addBooking$(data: any){
    return this.http.post(this.url, data)
  }

  // Edit
  editBooking$(data: any, id:number){
    return this.http.put(this.url + id,  data)
  }

  confirmBooking$(id: number){
    return this.http.put(this.url + id + "/confirm", {})
  }

  cancelBooking$(id: number){
    return this.http.put(this.url + id + "/cancel", {})
  }
}
