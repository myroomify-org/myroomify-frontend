import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AdminRoomsService {
  url = "http://localhost:8000/api/admin/rooms/"

  constructor(
    private http: HttpClient
  ){}

  getRooms$(){
    return this.http.get(this.url)
  }

  getRoom$(id: number){
    return this.http.get(this.url + id)
  }

  addRoom$(data: any){
    return this.http.post(this.url, data)
  }

  restoreRoom$(id:number,){
    return this.http.post(this.url + id + "/restore", {})
  }

  addImage$(id: number, data: any){
    return this.http.post(this.url + id + "/images", data)
  }

  editRoom$(id: number, data: any){
    return this.http.put(this.url + id, data)
  }

  deleteRoom$(id: number){
    return this.http.delete(this.url + id)
  }
}
