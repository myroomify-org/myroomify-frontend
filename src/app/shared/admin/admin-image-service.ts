import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AdminImageService {
  url = 'http://localhost:8000/api/admin/rooms/'

  constructor(
    private http: HttpClient
  ) {}

  addImages$(roomId: number, images: File[]){
    const formData = new FormData()
    images.forEach(file => formData.append('images[]', file, file.name))
    return this.http.post(this.url + roomId + '/images', formData)
  }

  setPrimary$(roomId: number, imageId: number){
    return this.http.put(this.url + roomId + '/images/' + imageId + '/primary', {})
  }

  deleteImage$(roomId: number, imageId: number){
    return this.http.delete(this.url + roomId + '/images/' + imageId)
  }
}
