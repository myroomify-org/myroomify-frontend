import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AdminUserService {
  url = "http://localhost:8000/api/admin/users/"

  constructor(
    private http: HttpClient
  ){}

  getUsers$(){
    return this.http.get(this.url)
  }

  getUser$(id: number){
    return this.http.get(this.url + id)
  }

  addUser$(data: any){
    return this.http.post(this.url, data)
  }

  editUser$(id:number, data: any){
    return this.http.put(this.url + id, data)
  }

  deleteUser$(id: number){
    return this.http.delete(this.url + id)
  }
}
