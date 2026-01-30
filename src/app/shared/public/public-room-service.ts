import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PublicRoomService {
  // Api
  url = "http://localhost:8000/api/public/rooms/"

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
}
