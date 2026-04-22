import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminUserService {
  // Api
  url = environment.apiHost + '/admin/users'

  constructor(
    private http: HttpClient
  ){}

  // Get
  getUsers$(){
    return this.http.get(this.url)
  }

  getUser$(id: number){
    return this.http.get(`${this.url}/${id}`)
  }

  // Add
  addUser$(data: any){
    return this.http.post(this.url, data)
  }

  restoreUser$(id:number,){
    return this.http.post(`${this.url}/${id}/restore`, {})
  }

  // Edit
  editUser$(id:number, data: any){
    return this.http.put(`${this.url}/${id}`, data)
  }

  changeRole$(id:number, data: any){
    return this.http.post(`${this.url}/${id}/change-role`, data)
  }

  activate$(id:number, data: any){
    return this.http.post(`${this.url}/${id}/activate`, data)
  }

  deactivate$(id:number, data: any){
    return this.http.post(`${this.url}/${id}/deactivate`, data)
  }

  // Delete
  deleteUser$(id: number){
    return this.http.delete(`${this.url}/${id}`)
  }

  // Force delete (permanent) - superadmin
  forceDeleteUser$(id: number){
    return this.http.delete(`${this.url}/${id}/force-delete`)
  }
}
