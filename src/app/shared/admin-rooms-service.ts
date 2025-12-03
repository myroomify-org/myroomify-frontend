import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AdminRoomsService {
  url = "http://myroomify.webtelek.hu/api/"

  constructor(
    private http: HttpClient
  ){}

  getRooms$(){
    const link = this.url + "rooms"
    return this.http.get(link)
  }
}
