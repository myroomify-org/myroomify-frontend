import { HttpClient, HttpParams } from '@angular/common/http';
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

  getAvailableRooms$(params: any) {
    let httpParams = new HttpParams()
      .set('start_date', params.start_date)
      .set('end_date', params.end_date)
      .set('capacity', params.capacity.toString())

    return this.http.get(this.url + 'available', {params: httpParams})
  }
}
