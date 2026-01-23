import { Component } from '@angular/core';
import { AdminRoomsService } from '../../shared/admin-rooms-service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-guest-home-page',
  imports: [CommonModule],
  templateUrl: './guest-home-page.html',
  styleUrl: './guest-home-page.css',
})
export class GuestHomePage {
  rooms: any[] = []

  constructor(
    private apiRooms: AdminRoomsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getRooms()
  }

  getRooms(): void {
    this.apiRooms.getRooms$().subscribe({
      next: (result: any) => {
        this.rooms = result.data.slice(0, 3)
        console.log(result)
      },
      error: (err) => console.error('Error getting rooms', err)
    });
  }

  navigateRooms(){
    this.router.navigate(['/rooms'])
  }

  navigateRoom(id:number){
    this.router.navigate(['/rooms/' + id])
  }
}
