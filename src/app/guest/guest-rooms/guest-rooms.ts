import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicRoomService} from '../../shared/public/public-room-service';
import { TranslateModule } from '@ngx-translate/core';

// Mat imports
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
  primary_image: string
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
    TranslateModule
  ],
  templateUrl: './guest-rooms.html',
  styleUrl: './guest-rooms.css',
})

export class GuestRooms {
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger

  rooms: Room[] = []
  filteredRooms: Room[] = []

  selectedGuests: number = 2
  startDate: Date | null = null
  endDate: Date | null = null
  // selectedRange: string = ''

  isChoosingCheckout: boolean = false
  readonly baseUrl = 'http://localhost:8000'

  constructor(
    private router: Router,
    private roomApi: PublicRoomService
  ) {}

  ngOnInit(): void {
    this.getRooms()
  }

  // Api / data
  getRooms(): void {
    this.roomApi.getRooms$().subscribe({
      next: (result: any) => {
        this.rooms = result.data
        this.filteredRooms = [...this.rooms]
      },
      error: (error: any) => {
        console.error('Error getting rooms', error)
      }
    })
  }

  getImageUrl(imageObject: any){
    const defaultImage = 'rooms/room.jpg'

    if (!imageObject?.path || typeof imageObject.path !== 'string') {
      return defaultImage;
    }

    return imageObject.path.startsWith('http') 
      ? imageObject.path 
      : `${this.baseUrl}/storage/${imageObject.path}`;
  }

  // Search Field
  searchRooms(): void {
    if (!this.startDate || !this.endDate) {
      return
    }
    const guestCount = Number(this.selectedGuests)

    this.filteredRooms = this.rooms.filter(room => {
      return room.capacity == guestCount
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
