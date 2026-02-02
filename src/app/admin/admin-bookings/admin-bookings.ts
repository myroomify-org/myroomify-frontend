import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import Swal from 'sweetalert2';

// Services
import { AdminBookingService } from '../../shared/admin/admin-booking-service';
import { AdminRoomsService } from '../../shared/admin/admin-rooms-service';
import { AdminUserService } from '../../shared/admin/admin-user-service';
import { AdminGuestService } from '../../shared/admin/admin-guest-service'; // Új szerviz importálva
import { AdminGuests } from '../admin-guests/admin-guests';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  providers: [ DatePipe],
  imports: [
    ReactiveFormsModule, 
    DatePipe, 
    CommonModule,
    AdminGuests
  ],

  templateUrl: './admin-bookings.html',
  styleUrl: './admin-bookings.css',
  encapsulation: ViewEncapsulation.None,
})

export class AdminBookings implements OnInit {

  // Variables
  bookings: any[] = []
  filteredBookings: any[] = []
  rooms: any[] = []
  users: any[] = []
  
  bookingForm!: FormGroup
  showModal = false
  addMode = true
  guests: any
  get guestControls() {
    const guests = this.bookingForm?.get('guests') as FormArray
    return guests ? guests.controls : []
  }

  showGuestModal = false
  selectedBookingForGuests: any = null

  constructor(
    private bookApi: AdminBookingService,
    private roomApi: AdminRoomsService,
    private userApi: AdminUserService,
    private guestApi: AdminGuestService,
    private builder: FormBuilder
  ) {}

  ngOnInit() {
    this.initForm()
    this.loadInitialData()
    this.setupUserSync()
  }

  // Booking Form Initialization
  private initForm() {
    this.bookingForm = this.builder.group({
    id: [''],
    user_id: [null, Validators.required],
    room_id: [null, Validators.required],
    check_in: ['', Validators.required],
    check_out: ['', Validators.required],
    booking_type: ['standard'],
    status: ['pending'],
    payment_status: ['unpaid'],
    guest_name: [''],
    guest_email: [''],
    guest_phone: [''],
    guest_count: [1, [Validators.required, Validators.min(1)]],
    guests: this.builder.array([])
    })
  }

  // Get username and email from selected user
  private setupUserSync() {
    this.bookingForm.get('user_id')?.valueChanges.subscribe(userId => {
      const userName = this.bookingForm.get('guest_name')
      const userEmail = this.bookingForm.get('guest_email')

      if (userId && userId !== 'null') {
        const selectedUser = this.users.find(u => u.id == userId)
        if (selectedUser) {
          this.bookingForm.patchValue({
            guest_name: selectedUser.name,
            guest_email: selectedUser.email
          }, { emitEvent: false })

          userName?.disable()
          userEmail?.disable()
        }
      } else {
        userName?.enable()
        userEmail?.enable()
      }
    })
  }

  setupGuests() {
    const count = this.bookingForm.get('guest_count')?.value || 0
    const guestsArray = this.bookingForm.get('guests') as FormArray
    
    while (guestsArray.length < count) {
      guestsArray.push(this.builder.group({
        id: [null], // Fontos az azonosításhoz
        first_name: ['', Validators.required],
        last_name: ['', Validators.required],
        birth_date: ['', Validators.required],
        nationality: ['', Validators.required],
        document_type: ['id_card', Validators.required],
        document_number: ['', Validators.required],
        country_name: ['', Validators.required],
        city_name: ['', Validators.required],
        postal_code: ['', Validators.required],
        address: ['', Validators.required]
      }))
    }
    while (guestsArray.length > count) {
      guestsArray.removeAt(guestsArray.length - 1)
    }
  }

  private loadInitialData() {
    this.getBookings()
    this.getRooms()
    this.getUsers()
  }

  // Get Datas
  getBookings() {
    this.bookApi.getBookings$().subscribe({
      next: (result: any) => {
        this.bookings = result.data.map((b: any) => ({
          ...b,
          isExpanded: false 
        }))
        this.filteredBookings = [...this.bookings]
        console.log(this.bookings)
      },
      error: (error) => console.error('Error loading bookings:', error)
    })
  }

  getRooms() {
    this.roomApi.getRooms$().subscribe({
      next: (result: any) => {
        this.rooms = result.data
      },
      error: (error) => console.error('Error loading rooms:', error)
    })
  }

  getUsers() {
    this.userApi.getUsers$().subscribe({
      next: (result: any) => {
        this.users = result.data || result;
      },
      error: (error) => console.error('Error loading users:', error)
    })
  }

  getGuestArray(): FormArray {
    return this.bookingForm.get('guests') as FormArray
  }

  calculateTotal(booking: any): number {
    if (!booking.check_in || !booking.check_out) return 0
    const pricePerNight = booking.room?.price_per_night || booking.room?.price || 0
    if (pricePerNight === 0) return 0

    const start = new Date(booking.check_in)
    const end = new Date(booking.check_out)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0
    
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? diffDays * pricePerNight : 0
  }

  // Save changes
  save() {
    if (this.bookingForm.invalid) {
      Swal.fire('Warning', 'Please check the form for errors.', 'warning');
      return;
    }
    const formData = this.bookingForm.getRawValue()

    if (this.addMode) {
      this.addBooking(formData)
    } else {
      const id = this.bookingForm.get('id')?.value
      this.editBooking(formData, id)
    }
  }

  // Add
  private addBooking(data: any) {
    this.bookApi.addBooking$(data).subscribe({
      next: () => this.success("Booking has been added"),
      error: () => this.failed()
    })
  }

  addGuest(guestData: any = null) {
    const guestGroup = this.builder.group({
      id: [guestData?.id || null],
      first_name: [guestData?.first_name || '', Validators.required],
      last_name: [guestData?.last_name || '', Validators.required],
      birth_date: [guestData?.birth_date || '', Validators.required],
      nationality: [guestData?.nationality || '', Validators.required],
      document_type: [guestData?.document_type || 'id_card', Validators.required],
      document_number: [guestData?.document_number || '', Validators.required],

      country_name: [guestData?.['address']?.['city']?.['country']?.['name'] || '', Validators.required],
      city_name: [guestData?.['address']?.['city']?.['name'] || '', Validators.required],
      postal_code: [guestData?.['address']?.['postal_code'] || '', Validators.required],
      address: [guestData?.['address']?.['address'] || '', Validators.required]
    })
    this.getGuestArray().push(guestGroup);
  }

  //Edit
  getForEdit(booking: any) {
    this.addMode = false
    this.showModal = true
    
    this.getGuestArray().clear()
    const data = { ...booking }

    if (booking.user?.id) data.user_id = booking.user.id
    if (booking.room?.id) data.room_id = booking.room.id

    if (!data.guest_name && booking.user?.name) data.guest_name = booking.user.name
    if (!data.guest_email && booking.user?.email) data.guest_email = booking.user.email
    if (!data.guest_phone && booking.user?.phone) data.guest_phone = booking.user.phone

    if (booking.check_in) {
      data.check_in = this.convertToInputDate(booking.check_in)
    }
    if (booking.check_out) {
      data.check_out = this.convertToInputDate(booking.check_out)
    }

    if (booking.guests && booking.guests.length > 0) {
      booking.guests.forEach((guest: any) => this.addGuest(guest))
    }

    this.bookingForm.patchValue(data)
  }

  private editBooking(data: any, id: number) {
    this.bookApi.editBooking$(data, id).subscribe({
      next: () => this.success("Booking has been updated"),
      error: () => this.failed()
    })
  }

  private convertToInputDate(dateValue: any): string {
    if (!dateValue) return ''
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  }

  async saveGuestsOnly() {
    if (this.getGuestArray().invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Data',
        text: 'Please fill in all required guest fields.',
        confirmButtonColor: '#2d4037'
      })
      return
    }

    if (this.selectedBookingForGuests.status !== 'confirmed') {
      Swal.fire({
        icon: 'info',
        title: 'Status Required',
        text: 'You must confirm the booking before adding guest details.',
        confirmButtonColor: '#c3ae80'
      })
      return;
    }
    
    const guests = this.getGuestArray().getRawValue()
    const bookingId = this.selectedBookingForGuests?.id

    if (!bookingId) return

    try {
      for (const guest of guests) {
        if (guest.id) {
          await this.guestApi.editGuest$(bookingId, guest.id, guest).toPromise();
        } else {
          await this.guestApi.addGuest$(bookingId, guest).toPromise();
        }
      }
      
      this.success("Guest details successfully updated!")
      this.showGuestModal = false
    } catch (err: any) {
      console.error("Save error:", err)
      const errorMsg = err.error?.message || "Failed to save guest data."
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMsg,
        confirmButtonColor: '#2d4037'
      })
    }
  }

  // Delete (Cancel booking)
  cancel() {
    this.showModal = false
    this.bookingForm.reset()
  }
  confirmCancel(id: number) {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#bb5127",
      cancelButtonColor: "#000000",
      confirmButtonText: "Delete"
    }).then((result) => {
      if (result.isConfirmed) {
        this.bookApi.cancelBooking$(id).subscribe({
          next: () => this.success("Booking has been deleted"),
          error: () => this.failed()
        })
      }
    })
  }

  deleteGuest(index: number) {
    this.getGuestArray().removeAt(index);
  }

  // Modal Control
  setShowModal() {
    this.addMode = true
    this.bookingForm.reset({ 
      status: 'pending', 
      payment_status: 'unpaid',
      guest_count: 1,
      booking_type: 'standard'
    })
    this.showModal = true
  }

  toggleRow(booking: any) {  
    booking.isExpanded = !booking.isExpanded
  }

  openGuestManager(booking: any) {
    this.selectedBookingForGuests = booking
    this.showGuestModal = true

    this.bookingForm.patchValue({
      id: booking.id,
      guest_count: booking.guest_count,
      status: booking.status
    })

    const guestsArray = this.getGuestArray()
    guestsArray.clear()
    
    if (booking.guests && booking.guests.length > 0) {
      booking.guests.forEach((guest: any) => this.addGuest(guest))
    } else {
      const count = booking.guest_count || 1
      for (let i = 0; i < count; i++) {
        this.addGuest()
      }
    }
  }

  hasExistingGuests(): boolean {
    const guests = this.getGuestArray().value;
    return guests.some((g: any) => g.id !== null && g.id !== undefined)
  }
  
  // Alerts
  private success(message: string) {
    this.getBookings()
    this.showModal = false
    Swal.fire({
      position: "center",
      icon: "success",
      title: message,
      showConfirmButton: false,
      timer: 2000
    })
  }

  private failed() {
    Swal.fire({
      icon: "error",
      title: "Oops, something went wrong",
      timer: 2500
    })
  }

  // Search Filters
  onSearch(event: any) {
    const term = event.target.value.toLowerCase()
    this.filteredBookings = this.bookings.filter(b => 
      b.guest_name?.toLowerCase().includes(term) || 
      b.guest_email?.toLowerCase().includes(term) ||
      b.id.toString().includes(term)
    )
  }

  onSort(event: any) {
    const key = event.target.value;
    this.filteredBookings.sort((a, b) => {
      let valA = (key === 'room') ? a.room?.name : a[key]
      let valB = (key === 'room') ? b.room?.name : b[key]
      return (valA < valB) ? -1 : (valA > valB) ? 1 : 0
    })
  }

  filterByStatus(event: any) {
    const status = event.target.value
    if (status === 'all') {
      this.filteredBookings = [...this.bookings]
    } else {
      this.filteredBookings = this.bookings.filter(b => b.status === status)
    }
  }
}