import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import Swal from 'sweetalert2';
import { firstValueFrom, forkJoin } from 'rxjs';

// Services
import { AdminBookingService } from '../../shared/admin/admin-booking-service';
import { AdminRoomsService } from '../../shared/admin/admin-rooms-service';
import { AdminUserService } from '../../shared/admin/admin-user-service';
import { AdminGuestService } from '../../shared/admin/admin-guest-service';
import { AdminGuests } from '../admin-guests/admin-guests';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  providers: [DatePipe],
  imports: [
    ReactiveFormsModule, 
    CommonModule,
    AdminGuests,
    TranslateModule
  ],
  templateUrl: './admin-bookings.html',
  styleUrl: './admin-bookings.css',
  encapsulation: ViewEncapsulation.None,
})
export class AdminBookings implements OnInit {
  bookings: any[] = []
  filteredBookings: any[] = []
  rooms: any[] = []
  users: any[] = []

  bookingForm!: FormGroup
  showModal = false
  showGuestModal = false
  addMode = true
  isSaving = false
  selectedBookingForGuests: any = null

  searchTerm: string = ''
  selectedStatus: string = 'all'
  sortKey: string = 'id'

  constructor(
    private bookApi: AdminBookingService,
    private roomApi: AdminRoomsService,
    private userApi: AdminUserService,
    private guestApi: AdminGuestService,
    private builder: FormBuilder,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.initForm()
    this.loadInitialData()
    this.setupUserSync()
    this.setupRoomCapacitySync()
  }

  private initForm() {
    this.bookingForm = this.builder.group({
      id: [''],
      user_id: [null],
      room_id: [null, Validators.required],
      check_in: ['', Validators.required],
      check_out: ['', Validators.required],
      booking_type: ['standard'],
      status: ['pending'],
      payment_status: ['unpaid'],
      guest_name: ['', Validators.required],
      guest_email: ['', [Validators.required, Validators.email]],
      guest_phone: [''],
      guest_count: [1, [Validators.required, Validators.min(1), (control: any) => {
        // Safe check for the validator
        if (!this.bookingForm) return null;
        const max = this.getSelectedRoomCapacity();
        return max > 0 && control.value > max ? { 'maxCapacity': { max, actual: control.value } } : null;
      }]],
      guests: this.builder.array([])
    })
  }

  get guestArray(): FormArray {
    return this.bookingForm.get('guests') as FormArray
  }

  get guestControls() {
    return this.guestArray.controls
  }

  private loadInitialData() {
    this.getBookings()
    this.getRooms()
    this.getUsers()
  }

  // Api calls
  getBookings() {
    this.bookApi.getBookings$().subscribe({
      next: (result: any) => {
        this.bookings = (result.data || []).map((booking: any) => ({
          ...booking,
          isExpanded: false
        }))
        this.applyFilters()
      },
      error: (error) => console.error(error)
    })
  }

  getRooms() {
    this.roomApi.getRooms$().subscribe({
      next: (result: any) => this.rooms = result.data || [],
      error: (error) => console.error('Error loading rooms:', error)
    });
  }

  getUsers() {
    this.userApi.getUsers$().subscribe({
      next: (result: any) => this.users = result.data || result || [],
      error: (error) => console.error('Error loading users:', error)
    })
  }

  // Search & Sort
  applyFilters() {
    let result = [...this.bookings]

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase()
      result = result.filter(booking => 
        booking.id?.toString().includes(search) ||
        booking.guest_name?.toLowerCase().includes(search) ||
        booking.user?.name?.toLowerCase().includes(search) ||
        booking.guest_email?.toLowerCase().includes(search) ||
        booking.user?.email?.toLowerCase().includes(search)
      )
    }

    if (this.selectedStatus !== 'all') {
      result = result.filter(booking => booking.status === this.selectedStatus)
    }

    if (this.sortKey) {
      result.sort((a, b) => {
        let valA = (this.sortKey === 'room') ? (a.room?.name || '') : (a[this.sortKey]?.toString() || '')
        let valB = (this.sortKey === 'room') ? (b.room?.name || '') : (b[this.sortKey]?.toString() || '')
        return valA.localeCompare(valB);
      })
    }

    this.filteredBookings = result;
  }

  onSort(event: any) {
    this.sortKey = event.target.value
    this.applyFilters()
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value.toLowerCase().trim()
    this.applyFilters()
  }

  filterByStatus(event: any) {
    this.selectedStatus = event.target.value
    this.applyFilters()
  }

  private setupUserSync() {
    this.bookingForm.get('user_id')?.valueChanges.subscribe(userId => {
      const nameCtrl = this.bookingForm.get('guest_name')
      const emailCtrl = this.bookingForm.get('guest_email')

      if (userId && userId !== 'null' && userId !== null) {
        const selectedUser = this.users.find(user => user.id == userId)
        if (selectedUser) {
          this.bookingForm.patchValue({
            guest_name: selectedUser.name,
            guest_email: selectedUser.email
          }, { emitEvent: false })
          nameCtrl?.disable()
          emailCtrl?.disable()
        }
      } else {
        nameCtrl?.enable()
        emailCtrl?.enable()
      }
    })
  }

  // Booking Modal
  setShowModal() {
    this.addMode = true
    this.showModal = true
    
    this.guestArray.clear()
    
    this.bookingForm.patchValue({
      id: '',
      user_id: null,
      room_id: null,
      check_in: '',
      check_out: '',
      booking_type: 'standard',
      status: 'pending',
      payment_status: 'unpaid',
      guest_name: '',
      guest_email: '',
      guest_phone: '',
      guest_count: 1
    }, { emitEvent: false })

    this.bookingForm.get('guest_name')?.enable()
    this.bookingForm.get('guest_email')?.enable()
    this.bookingForm.updateValueAndValidity()
  }

  getForEdit(booking: any) {
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return
    }
    
    this.addMode = false
    this.showModal = true
    this.guestArray.clear()

    const data = { ...booking }
    if (booking.user?.id) data.user_id = booking.user.id
    if (booking.room?.id) data.room_id = booking.room.id

    if (data.check_in) data.check_in = new Date(data.check_in).toISOString().split('T')[0]
    if (data.check_out) data.check_out = new Date(data.check_out).toISOString().split('T')[0]

    this.bookingForm.patchValue(data)
  }

  getSelectedRoomCapacity(): number {
    if (!this.bookingForm) return 0;
    const roomId = this.bookingForm.get('room_id')?.value
    if (!roomId || !this.rooms || this.rooms.length === 0) return 0
    const room = this.rooms.find(room => room.id == roomId)
    return room ? room.capacity : 0
  }

  private setupRoomCapacitySync() {
    this.bookingForm.get('room_id')?.valueChanges.subscribe(() => {
      this.bookingForm.get('guest_count')?.updateValueAndValidity()
    })
  }

  save() {
    if (this.bookingForm.invalid) {
      this.failed(this.translate.instant('ADMIN_ALERTS.FAILED.TITLE_INVALID_FORM'))
      return
    }

    this.isSaving = true
    const formData = this.bookingForm.getRawValue()
    const request = this.addMode 
      ? this.bookApi.addBooking$(formData) 
      : this.bookApi.editBooking$(formData, formData.id)

    request.subscribe({
      next: (response: any) => {
        this.isSaving = false
        this.success(response.message)
      },
      error: (error: any) => {
        this.isSaving = false
        this.failed(error.error?.message || error.message)
      }
    })
  }

  changeBookingStatus(id: number, newStatus: string) {
    const statusName = this.translate.instant(`ADMIN_BOOKINGS.FILTERS.${newStatus.toUpperCase()}`)

    Swal.fire({
      title: this.translate.instant('ADMIN_ALERTS.CONFIRM.TITLE_STATUS_CHANGE'),
      text: this.translate.instant('ADMIN_ALERTS.CONFIRM.TEXT_STATUS_CHANGE', { status: statusName }),
      icon: 'question',
      iconColor: '#c3ae80',
      showCancelButton: true,
      confirmButtonColor: '#2d4037',
      confirmButtonText: this.translate.instant('ADMIN_ALERTS.CONFIRM.YES')
    }).then(result => {
      if (result.isConfirmed) {
        this.isSaving = true
        let request$
        if (newStatus === 'confirmed') {
          request$ = this.bookApi.confirmBooking$(id);
        } else if (newStatus === 'completed') {
          const booking = this.bookings.find(b => b.id === id)
          const fullData = { ...booking, status: 'completed' }
          request$ = this.bookApi.editBooking$(fullData, id)
        }

        request$?.subscribe({
          next: (response: any) => {
            this.success(response.message)
            this.isSaving = false
          },
          error: (error: any) => {
            this.failed(error.error?.message)
            this.isSaving = false
          }
        })
      }
    })
  }

  // Guest Management
  addGuest(guestData: any = null) {
    const toStr = (val: any): string => (val !== null && val !== undefined) ? String(val) : 'Unknown';

    const guestGroup = this.builder.group({
      id: [guestData?.id || null],
      first_name: [guestData?.first_name || '', Validators.required],
      last_name: [guestData?.last_name || '', Validators.required],
      birth_date: [guestData?.birth_date ? new Date(guestData.birth_date).toISOString().split('T')[0] : '', Validators.required],
      document_type: [guestData?.document_type || 'id_card', Validators.required], 
      document_number: [guestData?.document_number || '', Validators.required],
      nationality: [toStr(guestData?.nationality)],
      country_name: [toStr(guestData?.country_name)],
      city_name: [toStr(guestData?.city_name)],
      postal_code: [toStr(guestData?.postal_code)],
      address: [toStr(guestData?.address)]
    })
    
    this.guestArray.push(guestGroup)
  }

  openGuestManager(booking: any) {
    this.selectedBookingForGuests = booking
    this.showGuestModal = true
    this.guestArray.clear()
    
    if (booking.guests && booking.guests.length > 0) {
      booking.guests.forEach((guest: any) => this.addGuest(guest))
    } else {
      const count = booking.guest_count || 1
      for (let i = 0; i < count; i++) this.addGuest()
    }
  }

  async saveGuestsOnly() {
    if (this.guestArray.invalid) {
      Swal.fire({
        icon: 'warning',
        iconColor: '#c3ae80',
        title: this.translate.instant('ADMIN_ALERTS.FAILED.TITLE_INVALID_FORM'),
        confirmButtonColor: '#2d4037'
      })
      return
    }

    this.isSaving = true
    const bookingId = this.selectedBookingForGuests.id
    const guests = this.guestArray.getRawValue()

    const requests = guests.map(guest => 
      guest.id 
        ? this.guestApi.editGuest$(bookingId, guest.id, guest) 
        : this.guestApi.addGuest$(bookingId, guest)
    )

    forkJoin(requests).subscribe({
      next: (response:any) => {
        this.isSaving = false
        this.success(response.message)
        this.showGuestModal = false
      },
      error: (error: any) => {
        this.isSaving = false
        this.failed(error.error?.message || error.message)
      }
    })
  }

  hasExistingGuests(): boolean {
    const guests = this.guestArray.getRawValue()
    return guests.some((guest: any) => guest.id !== null && guest.id !== undefined && guest.id !== '')
  }

  // Helper functions
  cancel() {
    this.showModal = false
    this.bookingForm.reset()
    this.guestArray.clear()
  }

  confirmCancel(id: number) {
    Swal.fire({
      title: this.translate.instant('ADMIN_ALERTS.CONFIRM.TITLE_DELETE_BOOKING'),
      text: this.translate.instant('ADMIN_ALERTS.CONFIRM.TEXT_DELETE_BOOKING'),
      icon: 'warning',
      iconColor: '#c3ae80',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('ADMIN_ALERTS.CONFIRM.CONFIRM_DELETE_BOOKING'),
      cancelButtonText: this.translate.instant('ADMIN_ALERTS.CONFIRM.CANCEL_DELETE_BOOKING'),
      confirmButtonColor: '#2d4037',
      cancelButtonColor: '#6c757d',
    }).then(result => {
      if (result.isConfirmed) {
        this.bookApi.cancelBooking$(id).subscribe({
          next: (response: any) => this.success(response.message),
          error: (error: any) => this.failed(error.message)
        })
      }
    })
  }

  deleteGuest(index: number) { 
    this.guestArray.removeAt(index)
  }

  toggleRow(booking: any) {
    booking.isExpanded = !booking.isExpanded
  }

  trackById(index: number, item: any) { 
    return item.id || index
  }

  // Alerts
  private success(title: string) {
    this.getBookings()
    this.showModal = false
    Swal.fire({
      icon: 'success',
      iconColor: '#c3ae80',
      title: title, 
      timer: 2000,
      showConfirmButton: false 
    })
  }

  private failed(title?: string) {
    Swal.fire({ 
      icon: 'error',
      title: title || 'Hiba történt!',
      confirmButtonColor: '#2d4037',
      timer: 2500 
    })
  }
}