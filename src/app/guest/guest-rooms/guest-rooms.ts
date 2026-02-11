import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicRoomService} from '../../shared/public/public-room-service';

// Mat imports
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { HttpParams } from '@angular/common/http';


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
    private roomApi: PublicRoomService
  ) {}

  ngOnInit(): void {
    this.getRooms()
  }

  // read
  getRooms(): void {
    this.roomApi.getRooms$().subscribe({
      next: (result: any) => {
        this.rooms = result.data
        this.filteredRooms = [...this.rooms]
        console.log(result)
      },
      error: (error: any) => console.error('Error getting rooms', error)
    })
  }

  // Search Field
  // Number of guests
  searchRooms(): void {
    if (!this.startDate || !this.endDate) {
      // alert('Please select a check-in and check-out date.')
      return
    }
    const guestCount = Number(this.selectedGuests)

    this.filteredRooms = this.rooms.filter(room => {
      return room.capacity >= guestCount
    })

    this.scrollToResults()

  }

  private scrollToResults(): void {
    setTimeout(() => {
      const element = document.getElementById('room-list');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  // Calendar
  openCalendar(forCheckout: boolean) {
    this.isChoosingCheckout = forCheckout
  }

  onDateSelected(date: Date | null) {
    if (!date) return

    if (!this.isChoosingCheckout) {
      this.startDate = date
      if (this.endDate && this.startDate > this.endDate) {
        this.endDate = null
      }
    } else {
      if (this.startDate && date < this.startDate) {
        this.startDate = date
        this.endDate = null
      } else {
        this.endDate = date
      }
    }
    setTimeout(() => {
      if (this.menuTrigger) {
        this.menuTrigger.closeMenu()
      }
    }, 150)
  }

  // Navigate
  navigate(id:number){
    this.router.navigate(['/rooms/' + id])
  }
}
