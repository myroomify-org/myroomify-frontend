import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminBookingService {
  //Api
  url = environment.apiHost + '/admin/bookings'

  constructor(
    private http: HttpClient
  ){}

  // Get
  getBookings$(){
    return this.http.get(this.url)
  }

  getBooking$(id: number){
    return this.http.get(`${this.url}/${id}`)
  }

  // Add
  addBooking$(data: any){
    return this.http.post(this.url, data)
  }

  // Edit
  editBooking$(data: any, id:number){
    return this.http.put(`${this.url}/${id}`,  data)
  }

  confirmBooking$(id: number){
    return this.http.post(`${this.url}/${id}/confirm`, {})
  }

  cancelBooking$(id: number){
    return this.http.post(`${this.url}/${id}/cancel`, {})
  }

  // Delete (soft)
  deleteBooking$(id: number){
    return this.http.delete(`${this.url}/${id}`)
  }

  // Restore
  restoreBooking$(id: number){
    return this.http.post(`${this.url}/${id}/restore`, {})
  }

  // Force delete (permanent)
  forceDeleteBooking$(id: number){
    return this.http.delete(`${this.url}/${id}/force-delete`)
  }
}
