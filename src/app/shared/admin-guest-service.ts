import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AdminGuestService {
  url = "http://localhost:8000/api/admin/guests/"

  constructor(
    private http: HttpClient
  ){}

  getGuests$(){
    return this.http.get(this.url)
  }

  getGuest$(id: number){
    return this.http.get(this.url + id)
  }

  addGuest$(data: any){
    return this.http.post(this.url, data)
  }

  editGuest$(id: number, data: any){
    return this.http.put(this.url, id, data)
  }

  deleteguest$(id: number){
    return this.http.delete(this.url + id)
  } 
}
