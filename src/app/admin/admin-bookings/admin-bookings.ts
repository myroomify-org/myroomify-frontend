import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import Swal from 'sweetalert2';

// Services
import { AdminBookingService } from '../../shared/admin/admin-booking-service';
import { AdminRoomsService } from '../../shared/admin/admin-rooms-service';
import { AdminUserService } from '../../shared/admin/admin-user-service';

// Material Imports
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatInputModule } from "@angular/material/input";
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  providers: [provideNativeDateAdapter(), DatePipe],
  imports: [
    ReactiveFormsModule, 
    DatePipe, 
    CommonModule, 
    MatFormFieldModule, 
    MatSelectModule, 
    MatDatepickerModule, 
    MatInputModule
  ],
  templateUrl: './admin-bookings.html',
  styleUrl: './admin-bookings.css',
})
export class AdminBookings implements OnInit {

  bookings: any[] = [];
  filteredBookings: any[] = [];
  rooms: any[] = [];
  users: any[] = [];
  
  bookingForm!: FormGroup;
  showModal = false;
  addMode = true;

  constructor(
    private bookApi: AdminBookingService,
    private roomApi: AdminRoomsService,
    private userApi: AdminUserService,
    private builder: FormBuilder
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadInitialData();
  }

  private initForm() {
    this.bookingForm = this.builder.group({
      id: [''],
      user_id: [null],
      room_id: [null],
      check_in: [''],
      check_out: [''],
      booking_type: ['standard'],
      status: ['pending'],
      payment_status: ['unpaid'],
      guest_name: [''],
      guest_email: [''],
      guest_phone: [''],
      guest_count: [1],
    });
  }

  private loadInitialData() {
    this.getBookings();
    this.getRooms();
    this.getUsers();
  }

  // 3. API Calls (Read)
  getBookings() {
    this.bookApi.getBookings$().subscribe({
      next: (result: any) => {
        this.bookings = result.data;
        this.filteredBookings = result.data;
      },
      error: (err) => console.error('Hiba a foglalások betöltésekor:', err)
    });
  }

  getRooms() {
    this.roomApi.getRooms$().subscribe({
      next: (result: any) => {
        this.rooms = result.data;
      },
      error: (err) => console.error('Hiba a szobák betöltésekor:', err)
    });
  }

  getUsers() {
    this.userApi.getUsers$().subscribe({
      next: (result: any) => {
        this.users = result.data || result;
      },
      error: (err) => console.error('Hiba a felhasználók betöltésekor:', err)
    });
  }

  save() {
    if (this.bookingForm.invalid) return;

    if (this.addMode) {
      this.addBooking();
    } else {
      const id = this.bookingForm.get('id')?.value
      this.editBooking(id)
    }
  }

  private addBooking() {
    this.bookApi.addBooking$(this.bookingForm.value).subscribe({
      next: () => this.handleSuccess("Booking has been added"),
      error: () => this.handleError()
    });
  }

  getForEdit(booking: any) {
    this.addMode = false;
    this.showModal = true;
    
    const data = { ...booking };

    if (booking.user?.id) data.user_id = booking.user.id;
    if (booking.room?.id) data.room_id = booking.room.id;

    if (!data.guest_name && booking.user?.name) data.guest_name = booking.user.name;
    if (!data.guest_email && booking.user?.email) data.guest_email = booking.user.email;
    if (!data.guest_phone && booking.user?.phone) data.guest_phone = booking.user.phone;

    if (booking.check_in) data.check_in = new Date(booking.check_in);
    if (booking.check_out) data.check_out = new Date(booking.check_out);

    this.bookingForm.patchValue(data);
  }

  private editBooking(id:number) {
    this.bookApi.editBooking$(this.bookingForm.value, id).subscribe({
      next: () => this.handleSuccess("Booking has been updated"),
      error: () => this.handleError()
    });
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
          next: () => this.handleSuccess("Booking has been deleted"),
          error: () => this.handleError()
        });
      }
    });
  }

  // 5. UI Helpers (Modal, Search, Sort)
  setShowModal() {
    this.addMode = true;
    this.bookingForm.reset({ 
      status: 'pending', 
      payment_status: 'unpaid',
      guest_count: 1,
      booking_type: 'standard'
    });
    this.showModal = true;
  }

  cancel() {
    this.showModal = false;
    this.bookingForm.reset();
  }

  private handleSuccess(message: string) {
    this.getBookings();
    this.showModal = false;
    Swal.fire({
      position: "center",
      icon: "success",
      title: message,
      showConfirmButton: false,
      timer: 2000
    });
  }

  private handleError() {
    Swal.fire({
      icon: "error",
      title: "Oops, something went wrong",
      timer: 2500
    });
  }

  onSearch(event: any) {
    const term = event.target.value.toLowerCase();
    this.filteredBookings = this.bookings.filter(b => 
      b.guest_name?.toLowerCase().includes(term) || 
      b.guest_email?.toLowerCase().includes(term) ||
      b.id.toString().includes(term)
    );
  }

  onSort(event: any) {
    const key = event.target.value;
    this.filteredBookings.sort((a, b) => {
      let valA = (key === 'room') ? a.room?.name : a[key];
      let valB = (key === 'room') ? b.room?.name : b[key];
      return (valA < valB) ? -1 : (valA > valB) ? 1 : 0;
    });
  }

  filterByStatus(event: any) {
    const status = event.target.value
    if (status === 'all') {
      this.filteredBookings = [...this.bookings];
    } else {
      this.filteredBookings = this.bookings.filter(b => b.status === status);
    }
  }
}