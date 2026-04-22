import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PublicRoomService {
  // Api
  url = environment.apiHost + '/public/rooms'

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
}
