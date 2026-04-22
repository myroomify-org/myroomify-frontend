import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminRoomsService {
  // Api
  url = environment.apiHost + '/admin/rooms'

  constructor(
    private http: HttpClient
  ){}

  // Get
  getRooms$(){
    return this.http.get(this.url)
  }

  getRoom$(id: number){
    return this.http.get(`${this.url}/${id}`)
  }

  // Add
  addRoom$(data: any){
    return this.http.post(this.url, data)
  }

  restoreRoom$(id:number,){
    return this.http.post(`${this.url}/${id}/restore`, {})
  }

  // Edit
  editRoom$(id: number, data: any){
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return this.http.post(`${this.url}/${id}`, data)
    }
    return this.http.put(`${this.url}/${id}`, data)
  }

  // Delete
  deleteRoom$(id: number){
    return this.http.delete(`${this.url}/${id}`)
  }

  // Force delete (permanent) - superadmin
  forceDeleteRoom$(id: number){
    return this.http.delete(`${this.url}/${id}/force-delete`)
  }
}
