import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

// Services
import { AuthService } from '../../shared/auth/auth-service';
import { MeBookingService } from '../../shared/me/me-booking-service';
import { PublicRoomService } from '../../shared/public/public-room-service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Mat imports
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-guest-room',
  standalone: true,
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
export class GuestRoom implements OnInit {

  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;

  room: any = null;
  loading: boolean = true;

  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedRange: string = '';
  today: Date = new Date();

  isChoosingCheckout: boolean = false;
  guest_count: number = 1;

  readonly baseUrl = 'http://localhost:8000';
  currentImageIndex: number = 0;
  images: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private roomApi: PublicRoomService,
    private bookingApi: MeBookingService,
    private authApi: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const roomId = Number(this.route.snapshot.paramMap.get('id'));
    this.route.queryParams.subscribe(params => {
      if (params['start']) {
        this.startDate = new Date(params['start']);
      }
      if (params['end']) {
        this.endDate = new Date(params['end']);
      }
      if (params['guests']) {
        this.guest_count = Number(params['guests']);
      }
    });

    if (roomId) {
      this.getRoom(roomId);
    }
  }

  // API hívás a szoba adataiért
  getRoom(id: number): void {
    this.roomApi.getRoom$(id).subscribe({
      next: (result: any) => {
        this.room = result?.data || result;
        
        if (this.room.images && Array.isArray(this.room.images)) {
          this.images = this.room.images;
        } else if (this.room.primary_image) {
          this.images = [this.room.primary_image];
        }
        
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading room details', error);
        this.failed(error.message || 'Error loading room details');
        this.loading = false;
      }
    });
  }

  // Galéria navigáció
  nextImage() {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
  }

  prevImage() {
    this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
  }

  selectImage(index: number) {
    this.currentImageIndex = index;
  }

  getImageUrl(imageObject: any): string {
    const defaultImage = 'rooms/room.jpg';
    if (!imageObject || !imageObject.path) return defaultImage;
    const path = imageObject.path;
    if (path.startsWith('http')) return path;
    return `${this.baseUrl}/storage/${path}`;
  }

  // Naptár kezelés
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

  // Foglalási folyamat
  async bookRoom() {
    const isLoggedIn = await firstValueFrom(this.authApi.isLoggedIn$);
    const user = await firstValueFrom(this.authApi.currentUser$);

    if (!isLoggedIn) {
      this.warning(this.translate.instant('GUEST_ALERTS.WARNING.BOOK_LOGIN'));

      localStorage.setItem('pending_booking_room_id', this.room.id);
      if (this.startDate) localStorage.setItem('pending_start', this.formatDate(this.startDate));
      if (this.endDate) localStorage.setItem('pending_end', this.formatDate(this.endDate));
      localStorage.setItem('pending_guests', this.guest_count.toString());
      
      this.router.navigate(['/login']);
      return;
    }

    if (!this.startDate || !this.endDate) {
      this.warning(this.translate.instant('GUEST_ALERTS.WARNING.BOOK_DATES'));
      return;
    }

    const confirmed = await this.confirm(
      this.translate.instant('GUEST_ALERTS.CONFIRM.TEXT_BOOK')
    );

    if (!confirmed) return;
    
    const finalPrice = this.calculateTotalPrice();

    const bookingData = {
      room_id: this.room.id,
      user_id: user.id,
      check_in: this.formatDate(this.startDate),
      check_out: this.formatDate(this.endDate),
      guest_count: this.guest_count,
      total_price: finalPrice,
      status: 'pending'
    };

    this.bookingApi.addBooking$(bookingData).subscribe({
      next: () => {
        this.success(this.translate.instant('GUEST_ALERTS.SUCCESS.TITLE_BOOK'));
        this.router.navigate(['/profile'], {
          queryParams: { tab: 'bookings' },
          replaceUrl: true
        });
      },
      error: (error: any) => {
        this.failed(error.message || this.translate.instant('GUEST_ALERTS.FAILED.TITLE_BOOK'));
      }
    });
  }

  calculateTotalPrice(): number {
    if (!this.startDate || !this.endDate || !this.room) return 0;

    const diffInTime = this.endDate.getTime() - this.startDate.getTime();
    const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));
    
    const nights = diffInDays > 0 ? diffInDays : 1;

    const pricePerNight = this.room.total_price || this.room.price;
    return pricePerNight * this.guest_count * nights;
  }

  // SweetAlerts
  success(text: string) {
    Swal.fire({
      icon: 'success',
      iconColor: '#c3ae80',
      title: text,
      showConfirmButton: false,
      timer: 1500
    });
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
      },
      timer: 2500
    });
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
    });
    return result.isConfirmed;
  }

  failed(text: string) {
    Swal.fire({
      icon: 'error',
      title: this.translate.instant('GUEST_ALERTS.FAILED.TITLE'),
      text: text,
      confirmButtonColor: '#2d4037',
      customClass: {
        popup: 'rounded-4 shadow-lg',
        confirmButton: 'rounded-pill px-4',
      }
    });
  }
}