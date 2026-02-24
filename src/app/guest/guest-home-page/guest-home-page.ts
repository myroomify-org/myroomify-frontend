import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PublicRoomService } from '../../shared/public/public-room-service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-guest-home-page',
  imports: [CommonModule, TranslateModule],
  templateUrl: './guest-home-page.html',
  styleUrl: './guest-home-page.css',
})
export class GuestHomePage {
  rooms: any[] = []

  constructor(
    private roomApi: PublicRoomService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getRooms()
  }

  getRooms(): void {
    this.roomApi.getRooms$().subscribe({
      next: (result: any) => {
        this.rooms = result.data.slice(0, 3)
        console.log(result)
      },
      error: (error:any) => {
        console.error('Error getting rooms', error)
      }
    })
  }

  navigateRooms(){
    this.router.navigate(['/rooms'])
  }

  navigateRoom(id:number){
    this.router.navigate(['/rooms/' + id])
  }
}
