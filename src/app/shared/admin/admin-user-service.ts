import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AdminUserService {
  // Api
  url = "http://localhost:8000/api/admin/users/"

  constructor(
    private http: HttpClient
  ){}

  // Get
  getUsers$(){
    return this.http.get(this.url)
  }

  getUser$(id: number){
    return this.http.get(this.url + id)
  }

  // Add
  addUser$(data: any){
    return this.http.post(this.url, data)
  }

  restoreUser$(id:number,){
    return this.http.post(this.url + id + "/restore", {})
  }

  // Edit
  editUser$(id:number, data: any){
    return this.http.put(this.url + id, data)
  }

  // Delete
  deleteUser$(id: number){
    return this.http.delete(this.url + id)
  }
}
