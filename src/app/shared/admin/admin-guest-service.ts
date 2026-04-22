import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminGuestService {
  // Api
  url = environment.apiHost + '/admin/bookings'

  constructor(
    private http: HttpClient
  ){}

  // Add
  addGuest$(bookingId: number,data: any){
    return this.http.post(`${this.url}/${bookingId}/guests`, data)
  }

  // Edit
  editGuest$(bookingId: number, guestId: number, data: any){
    return this.http.put(`${this.url}/${bookingId}/guests/${guestId}`, data)
  }

  // Delete
  deleteguest$(bookingId: number, guestId: number){
    return this.http.delete(`${this.url}/${bookingId}/guests/${guestId}`)
  } 
}
