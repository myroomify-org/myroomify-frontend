import { Component, OnInit } from '@angular/core';
import { MeBookingService } from '../../shared/me/me-booking-service';
import { MeProfileService  } from '../../shared/me/me-profile-service';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Mat imports
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/auth/auth-service';

@Component({
  selector: 'app-guest-profile',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatDatepickerModule,
    MatMenuModule,
    MatButtonModule,
    MatNativeDateModule,
    TranslateModule
  ],
  templateUrl: './guest-profile.html',
  styleUrl: './guest-profile.css',
})
export class GuestProfile implements OnInit {
  user: any = {}
  bookings: any[] = []
  isEditing: boolean = false
  loading: boolean = true
  activeTab: 'details' | 'bookings' = 'details'
  editingBookingId: number | null = null

  isChoosingCheckout: boolean = false
  today: Date = new Date()
  originalBookingData: any = null

  passwordData = { current_password: '', new_password: '', new_password_confirmation: '' }
  newEmail = ''
  showPasswordFields: boolean = false

  constructor(
    private bookingApi: MeBookingService,
    private profileApi: MeProfileService,
    private router: Router,
    private translate: TranslateService,
    private authApi: AuthService
  ) {}

  ngOnInit(): void {
    this.getDatas()
  }

  
  getDatas() {
    this.profileApi.getProfile$().subscribe({
      next: (result: any) => {
        this.user = this.mapUserData(result.data)
        this.loading = false
      }
    })

    this.bookingApi.getBookings$().subscribe({
      next: (result: any) => {
        this.bookings = result.data.map((b: any) => ({
          ...b,
          check_in: new Date(b.check_in),
          check_out: new Date(b.check_out)
        }))
      }
    })
  }

  // User Profile
  private mapUserData(apiData: any) {
    const profile = apiData?.profile || {}
    const address = profile?.address || {}
    
    return {
      id: apiData.id,
      name: apiData.name,
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      phone: profile.phone || '',
      email: apiData.email,
      country_name: address.city?.country?.name || '',
      city_name: address.city?.name || '',
      postal_code: address.postal_code || '',
      address: address.address || '',
      rawProfile: profile 
    }
  }

  // Edit user
  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  saveProfile() {
    this.profileApi.editProfile$(this.user).subscribe({
      next: (result: any) => {
        this.user = this.mapUserData(result.data)
        this.success(this.translate.instant("GUEST_ALERTS.SUCCESS.TITLE_PROFILE_UPDATE"))
        this.isEditing = false
      },
      error: () => {
        this.failed(this.translate.instant("GUEST_ALERTS.FAILED.TITLE_PROFILE_UPDATE"))
      }
    })
  }

  saveEmail() {
    this.profileApi.editEmail$({ email: this.newEmail }).subscribe({
      next: () => {
        this.user.email = this.newEmail
        this.success(this.translate.instant("GUEST_ALERTS.SUCCESS.TITLE_EMAIL_UPDATE"))
      },
      error: () => {
        this.failed(this.translate.instant("GUEST_ALERTS.FAILED.TITLE_EMAIL_UPDATE"))
      }
    })
  }

  savePassword() {
    if (this.passwordData.new_password !== this.passwordData.new_password_confirmation) {
      this.failed(this.translate.instant("GUEST_ALERTS.FAILED.TITLE_PASSWORD_CONFIRM"))
      return
    }

    this.profileApi.editPassword$(this.passwordData).subscribe({
      next: () => {
        this.showPasswordFields = false
        this.passwordData = { current_password: '', new_password: '', new_password_confirmation: '' }

        localStorage.removeItem('token')
        sessionStorage.removeItem('token')

        setTimeout(() => {
          this.router.navigate(['/login'])
          this.authApi.logout$()
        }, 2000)

        
        
        this.success(this.translate.instant("GUEST_ALERTS.SUCCESS.TITLE_PASSWORD_CHANGE"), this.translate.instant("GUEST_ALERTS.SUCCESS.TEXT_PASSWORD_CHANGE"))
      },
      error: () => {
        this.failed(this.translate.instant("GUEST_ALERTS.FAILED.TITLE_PASSWORD_CHANGE"))
      }
    })
  }


  //Booking Profile
  private formatDate(date: Date | string): string {
    const d = new Date(date)
    return [
      d.getFullYear(),
      ('' + (d.getMonth() + 1)).padStart(2, '0'),
      ('' + d.getDate()).padStart(2, '0')
    ].join('-')
  }

  startEditBooking(booking: any) {
    this.editingBookingId = booking.id
    this.originalBookingData = JSON.parse(JSON.stringify(booking))
  }

  onDateSelected(date: Date | null, booking: any, triggerIn: MatMenuTrigger, triggerOut: MatMenuTrigger) {
    if (!date) return
    if (!this.isChoosingCheckout) {
      booking.check_in = date
      this.isChoosingCheckout = true
    } else {
      booking.check_out = date
      setTimeout(() => {
        triggerIn.closeMenu()
        triggerOut.closeMenu()
      }, 200)
    }
  }

  async editBooking(booking: any) {
    const updatedData = {
      check_in: this.formatDate(booking.check_in),
      check_out: this.formatDate(booking.check_out),
      room_id: booking.room_id,
      status: booking.status,
      guest_count: booking.guest_count
    }

    if (updatedData.status === 'cancelled' && this.originalBookingData?.status !== 'cancelled') {
      const confirmed = await this.confirm(this.translate.instant('GUEST_ALERTS.CONFIRM.TEXT_CANCEL'))
      if (confirmed) {
        this.sendCancelRequest(booking.id)
      } else {
        this.cancelEdit(booking)
      }
    } else {
      this.sendUpdateRequest(booking.id, updatedData)
    }
  }

  private sendCancelRequest(id: number) {
    this.bookingApi.cancelBooking$(id).subscribe({
      next: (result: any) => {
        const index = this.bookings.findIndex(b => b.id === id)
        if (index !== -1) {
          const updatedBooking = result.data || result
          this.bookings[index] = {
            ...updatedBooking,
            check_in: new Date(updatedBooking.check_in),
            check_out: new Date(updatedBooking.check_out)
          }
          this.bookings = [...this.bookings]
        }
        this.editingBookingId = null
        this.originalBookingData = null
        this.isChoosingCheckout = false
      },
      error: () => {
        this.failed(this.translate.instant("GUEST_ALERTS.FAILED.TITLE_BOOK_CANCEL"))
        this.getDatas()
      }
    })
  }

  private sendUpdateRequest(id: number, data: any) {
    this.bookingApi.editBooking$(id, data).subscribe({
      next: (result: any) => {
        const index = this.bookings.findIndex(booking => booking.id === id)
        if (index !== -1) {
          const updatedBooking = result.data || result
        
          this.bookings[index] = {
            ...updatedBooking,
            check_in: new Date(updatedBooking.check_in),
            check_out: new Date(updatedBooking.check_out)
          }
          this.bookings = [...this.bookings]
        }
        this.editingBookingId = null;
        this.originalBookingData = null
      },
      error: () => {
        this.failed(this.translate.instant("GUEST_ALERTS.FAILED.TITLE_BOOK_UPDATE"))
        this.getDatas()
      }
    })
  }

  cancelEdit(booking: any) {
    if (this.originalBookingData) {
      booking.check_in = new Date(this.originalBookingData.check_in)
      booking.check_out = new Date(this.originalBookingData.check_out)
      booking.status = this.originalBookingData.status
    }
    this.editingBookingId = null
    this.originalBookingData = null
    this.isChoosingCheckout = false
  }

  // Alerts
  success(title: string, text?: string) {
    Swal.fire({
      icon: 'success',
      iconColor: '#c3ae80',
      title: title,
      text: text,
      showConfirmButton: false,
      timer: 1500,
      customClass: {
        popup: 'rounded-4 shadow-lg',
        confirmButton: 'rounded-pill px-4',
      }
    })
  }

  async confirm(title: string){
    const result = await Swal.fire({
      icon: 'question',
      iconColor: '#c3ae80',
      title: title,
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
  
  failed(title: string) {
    Swal.fire({
      icon: 'error',
      title: title,
      confirmButtonColor: '#2d4037',
      customClass: {
        popup: 'rounded-4 shadow-lg',
        confirmButton: 'rounded-pill px-4',
      }
    })
  }
}