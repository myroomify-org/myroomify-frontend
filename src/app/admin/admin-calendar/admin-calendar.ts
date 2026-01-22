import { Component } from '@angular/core'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatNativeDateModule } from '@angular/material/core'
import { FullCalendarModule } from '@fullcalendar/angular'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { AdminRoomsService } from '../../shared/admin-rooms-service'
import { AdminBookingService } from '../../shared/admin-booking-service'
import { forkJoin } from 'rxjs'
import { CommonModule } from '@angular/common'



@Component({
  selector: 'app-admin-calendar',
  imports: [MatDatepickerModule, MatNativeDateModule, FullCalendarModule, CommonModule],
  templateUrl: './admin-calendar.html',
  styleUrl: './admin-calendar.css',
})

export class AdminCalendar {
  roomCalendar: any[] = []
  filteredCalendars: any[] = []
  rooms: any[] = []
  booking: any = null;

  constructor(
      private roomApi: AdminRoomsService,
      private bookApi: AdminBookingService
  ) {}

  ngOnInit() {
      this.get()
  }

  // Crud start
  // read
  get() {
    forkJoin({
      rooms: this.roomApi.getRooms$(),
      bookings: this.bookApi.getBookings$()
    }).subscribe({
      next: (result: any) => {
        this.rooms = result.rooms.data
        this.getCalendars(result.rooms.data, result.bookings.data)
        this.filteredCalendars = this.roomCalendar
      },
      error: (err) => console.error("Hiba az adatok betöltésekor", err)
    })
  }

  // Calendar
  getCalendars(rooms: any[], allBookings: any[]) {
    this.roomCalendar = rooms.map(room => {
      return {
        roomId: room.id,
        roomName: room.name,
        options: {
          plugins: [dayGridPlugin, interactionPlugin],
          initialView: 'dayGridMonth',
          headerToolbar: { left: 'prev,next', center: 'title', right: '' },
          eventClick: (info: any) => this.handleEventClick(info),
          events: allBookings
            .filter(booking => booking.room.id === room.id)
            .map(booking => ({
              title: booking.guest_name,
              extendedProps: {
                email: booking.guest_email
              },
              start: booking.check_in,
              end: booking.check_out,
              color: '#134e4a'
            }))
        }
      }
    })
  }
  // Crud end

  // Info modal
  handleEventClick(info: any) {
    const extraData = info.event.extendedProps
    this.booking = {
      title: info.event.title,
      email: extraData['email'],
      start: info.event.startStr.substring(0, 10),
      end: info.event.endStr.substring(0, 10)
    };

    const modal = document.getElementById('bookingModal')
    if(modal) {
      const bsModal = new (window as any).bootstrap.Modal(modal)
      bsModal.show();
    }
  }

  // Search
  onFilter(event: any) {
    const roomId = event.target.value

    if(roomId === 'all') {
      this.filteredCalendars = this.roomCalendar
    }else {
      this.filteredCalendars = this.roomCalendar.filter(
        room => room.roomId == roomId
      )
    }
  }
}
