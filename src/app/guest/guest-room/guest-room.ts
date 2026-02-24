import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../shared/auth/auth-service';
import { firstValueFrom } from 'rxjs';
import { MeBookingService } from '../../shared/me/me-booking-service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { PublicRoomService } from '../../shared/public/public-room-service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';


// mat imports
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-guest-room',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatDatepickerModule,
    MatMenuModule,
    MatButtonModule,
    MatNativeDateModule,
    TranslateModule
  ],
  templateUrl: './guest-room.html',
  styleUrl: './guest-room.css',
})
export class GuestRoom implements OnInit{

  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;

  room: any = null
  loading: boolean = true

  startDate: Date | null = null
  endDate: Date | null = null
  selectedRange: string = ''
  today: Date = new Date()

  isChoosingCheckout: boolean = false
  guest_count: number = 1

  readonly baseUrl = 'http://localhost:8000'
  currentImageIndex: number = 0
  images: any[] = []

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private roomApi: PublicRoomService,
    private bookingApi: MeBookingService,
    private authApi: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const roomId = Number(this.route.snapshot.paramMap.get('id'))
    if (roomId) {
      this.getRoom(roomId)
    }
  }

  // Get
  getRoom(id: number): void {
    this.roomApi.getRoom$(id).subscribe({
      next: (result: any) => {
        this.room = result?.data || result
        
        if (this.room.images && Array.isArray(this.room.images)) {
          this.images = this.room.images
        } else if (this.room.primary_image) {
          this.images = [this.room.primary_image]
        }
        
        this.loading = false
      },
      error: (error: any) => {
        console.error('Error loading room details', error)
        this.loading = false
      }
    })
  }

  // Gallery Navigation
  nextImage() {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length
  }

  prevImage() {
    this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length
  }

  selectImage(index: number) {
    this.currentImageIndex = index
  }

  getImageUrl(imageObject: any): string {
    const defaultImage = 'rooms/room.jpg'

    if (!imageObject || !imageObject.path) return defaultImage
    const path = imageObject.path

    if (path.startsWith('http')) return path
    
    return `${this.baseUrl}/storage/${path}`
  }

  // Calendar
  onDateSelected(date: Date | null) {
    if (!date) return

    if (!this.isChoosingCheckout) {
      this.startDate = date;
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

  private formatDate(date: Date): string {
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();

    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }

  openCalendar(forCheckout: boolean) {
    this.isChoosingCheckout = forCheckout;
  }

  //Booking
  async bookRoom() {
    const isLoggedIn = await firstValueFrom(this.authApi.isLoggedIn$)
    const user = await firstValueFrom(this.authApi.currentUser$)

    if (!isLoggedIn) {
      this.warning(this.translate.instant('GUEST_ALERTS.WARNING.BOOK_LOGIN'))
      localStorage.setItem('pending_booking_room_id', this.room.id)
      this.router.navigate(['/login'])
      return
    }

    if (!this.startDate || !this.endDate) {
      this.warning(this.translate.instant('GUEST_ALERTS.WARNING.BOOK_DATES'))
      return
    }

    const confirmed = await this.confirm(
      this.translate.instant('GUEST_ALERTS.CONFIRM.TEXT_BOOK', { count: this.guest_count })
    )

    if (!confirmed) return
    const finalprice = this.calculateTotalPrice()

    const bookingData = {
      room_id: this.room.id,
      user_id: user.id,
      check_in: this.formatDate(this.startDate),
      check_out: this.formatDate(this.endDate),
      guest_count: this.guest_count,
      total_price: finalprice,
      status: ''
    }

    this.bookingApi.addBooking$(bookingData).subscribe({
      next: () => {
        this.success(this.translate.instant('GUEST_ALERTS.SUCCESS.TITLE_BOOK'))
        this.router.navigate(['/profile'])
      },
      error: () => {
        this.failed("this.translate.instant('GUEST_ALERTS.FAILED.TITLE_BOOK")
      }
      })
  }

  calculateTotalPrice(): number {
    if (!this.startDate || !this.endDate || !this.room) return 0

    const diffInTime = this.endDate.getTime() - this.startDate.getTime()
    const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24))
    
    const nights = diffInDays > 0 ? diffInDays : 1

    return this.room.price_per_night * this.guest_count * nights
  }

  // Alerts
  success(text: string) {
    Swal.fire({
      icon: 'success',
      iconColor: '#c3ae80',
      title: text,
      showConfirmButton: false,
      timer: 1500
    })
  }

  warning(text: string) {
    Swal.fire({
      icon: 'warning',
      iconColor: '#c3ae80',
      title: text,
      showConfirmButton: true,
      confirmButtonColor: '#2d4037',
      customClass: {
        popup: 'rounded-4 shadow-lg',
        confirmButton: 'rounded-pill px-4',
      }
    })
  }

  async confirm(text: string) {
    const result = await Swal.fire({
      icon: 'question',
      iconColor: '#c3ae80',
      title: text,
      showCancelButton: true,
      confirmButtonColor: '#2d4037',
      cancelButtonColor: '#f8f9fa',
      confirmButtonText: this.translate.instant('GUEST_ALERTS.CONFIRM.CONFIRM_BOOK'),
      cancelButtonText: this.translate.instant('GUEST_ALERTS.CONFIRM.CANCEL_BOOK'),
      color: '#2d4037',
      background: '#fcfbf7',
      customClass: {
        popup: 'rounded-4 shadow-lg',
        confirmButton: 'rounded-pill px-4',
        cancelButton: 'rounded-pill px-4 text-dark border'
      }
    })
    return result.isConfirmed
  }

  failed(text: string) {
    Swal.fire({
      icon: 'error',
      title: text,
      text: this.translate.instant('GUEST_ALERTS.FAILED.TEXT_BOOK'),
      confirmButtonColor: '#2d4037',
      customClass: {
        popup: 'rounded-4 shadow-lg',
        confirmButton: 'rounded-pill px-4',
      }
    })
  }
}
