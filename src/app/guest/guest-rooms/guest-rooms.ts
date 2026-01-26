import { Component, ViewChild } from '@angular/core';
import { AdminRoomsService } from '../../shared/admin-rooms-service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// mat imports
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuTrigger } from '@angular/material/menu';

interface Room {
  id: number
  name: string
  capacity: number
  description: string
  price: number
  is_available: boolean
  image: string
}

@Component({
  selector: 'app-guest-rooms',
  imports: [
    CommonModule,
    FormsModule,
    MatMenuModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './guest-rooms.html',
  styleUrl: './guest-rooms.css',
})

export class GuestRooms {

  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;

  rooms: Room[] = []
  filteredRooms: Room[] = []

  selectedGuests: number = 2
  startDate: Date | null = null
  endDate: Date | null = null
  selectedRange: string = ''

  isChoosingCheckout: boolean = false

  constructor(
    private router: Router,
    private apiRooms: AdminRoomsService
  ) {}

  ngOnInit(): void {
    this.getRooms()
  }

  getRooms(): void {
    this.apiRooms.getRooms$().subscribe({
      next: (result: any) => {
        this.rooms = result.data
        this.filteredRooms = [...this.rooms]
        console.log(result)
      },
      error: (err) => console.error('Error getting rooms', err)
    });
  }

  searchRooms(): void {
    const guestCount = Number(this.selectedGuests)
    console.log('Keresett létszám:', guestCount);
    console.log('Összes szoba:', this.rooms);
    this.filteredRooms = this.rooms.filter(room => {
      const matchesCapacity = room.capacity == guestCount
      const isAvailable = room.is_available
      return matchesCapacity && isAvailable
    })
    console.log('Szűrt szobák:', this.filteredRooms);

    setTimeout(() => {
      const element = document.getElementById('room-list');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }, 100)
  }

  openCalendar(forCheckout: boolean) {
    this.isChoosingCheckout = forCheckout
  }

  onDateSelected(date: Date | null) {
    if (!date) return;

    if (!this.isChoosingCheckout) {
      this.startDate = date;
      if (this.endDate && this.startDate > this.endDate) {
        this.endDate = null;
      }
    } else {
      if (this.startDate && date < this.startDate) {
        this.startDate = date;
        this.endDate = null;
      } else {
        this.endDate = date;
      }
    }
    setTimeout(() => {
      if (this.menuTrigger) {
        this.menuTrigger.closeMenu();
      }
    }, 150);
  }

  navigate(id:number){
    this.router.navigate(['/rooms/' + id])
  }
}
