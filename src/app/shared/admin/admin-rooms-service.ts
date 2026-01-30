import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AdminRoomsService {
  // Api
  url = "http://localhost:8000/api/admin/rooms/"

  constructor(
    private http: HttpClient
  ){}

  // Get
  getRooms$(){
    return this.http.get(this.url)
  }

  getRoom$(id: number){
    return this.http.get(this.url + id)
  }

  // Add
  addRoom$(data: any){
    return this.http.post(this.url, data)
  }

  restoreRoom$(id:number,){
    return this.http.post(this.url + id + "/restore", {})
  }

  // Edit
  editRoom$(id: number, data: any){
    return this.http.put(this.url + id, data)
  }

  // Delete
  deleteRoom$(id: number){
    return this.http.delete(this.url + id)
  }
}
