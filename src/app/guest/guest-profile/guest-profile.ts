import { Component, OnInit } from '@angular/core';
import { MeBookingService } from '../../shared/me/me-booking-service';
import { MeProfileService  } from '../../shared/me/me-profile-service';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Mat imports
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';

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
    private profileApi: MeProfileService
  ) {}

  ngOnInit(): void {
    this.getUserData()
  }

  getUserData() {
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
    };
  }

  calculateTotalPrice(booking: any): number {
    if (booking.check_in && booking.check_out && booking.room?.price) {
      const checkIn = new Date(booking.check_in)
      const checkOut = new Date(booking.check_out)
      const diffTime = checkOut.getTime() - checkIn.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 ? diffDays * booking.room.price : 0
    }
    return 0;
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  saveProfile() {
    this.profileApi.editProfile$(this.user).subscribe({
      next: (result: any) => {
        this.user = this.mapUserData(result.data)
        this.success("Profile updated successfully")
        this.isEditing = false
      },
      error: () => this.failed("Profile update failed")
    })
  }

  saveEmail() {
    this.profileApi.editEmail$({ email: this.newEmail }).subscribe({
      next: () => {
        this.user.email = this.newEmail
        this.success("Email updated successfully")
      },
      error: () => this.failed("Email update failed")
    });
  }

  savePassword() {
    if (this.passwordData.new_password !== this.passwordData.new_password_confirmation) {
      Swal.fire('Error', 'The new passwords do not match!', 'error')
      return
    }

    this.profileApi.editPassword$(this.passwordData).subscribe({
      next: () => {
        this.showPasswordFields = false
        this.passwordData = { current_password: '', new_password: '', new_password_confirmation: '' }
        this.success("Password updated successfully")
      },
      error: () => this.failed("Password update failed")
    })
  }

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

  editBooking(booking: any) {
    const updatedData = {
      check_in: this.formatDate(booking.check_in),
      check_out: this.formatDate(booking.check_out),
      room_id: booking.room_id,
      status: booking.status,
      guest_count: booking.guest_count
    }

    if (updatedData.status === 'cancelled' && this.originalBookingData?.status !== 'cancelled') {
      Swal.fire({
        title: 'Are you sure?',
        text: "Setting this booking to 'Cancelled' cannot be undone easily!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#2d4037',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, cancel reservation'
      }).then((result) => {
        if (result.isConfirmed) {
          this.sendUpdateRequest(booking.id, updatedData);
        } else {
          this.cancelEdit(booking);
        }
      });
    } else {
      this.sendUpdateRequest(booking.id, updatedData);
    }
  }

  private sendUpdateRequest(id: number, data: any) {
    this.bookingApi.editBooking$(id, data).subscribe({
      next: () => {
        this.success("Booking has been updated")
        this.editingBookingId = null
        this.originalBookingData = null
        this.getUserData()
      },
      error: (err) => {
        this.failed("Update failed: " + (err.error?.message || "Server error"))
      }
    });
  }

  cancelEdit(booking: any) {
    if (this.originalBookingData) {
      booking.check_in = new Date(this.originalBookingData.check_in);
      booking.check_out = new Date(this.originalBookingData.check_out);
      booking.status = this.originalBookingData.status;
    }
    this.editingBookingId = null;
    this.originalBookingData = null;
    this.isChoosingCheckout = false;
  }

  success(response: any) {
    Swal.fire({
      icon: 'success',
      title: response,
      showConfirmButton: false,
      timer: 1500
    })
  }
  
  failed(response: any) {
    Swal.fire({
      icon: 'error',
      title: response,
      confirmButtonColor: '#2d4037'
    })
  }
}