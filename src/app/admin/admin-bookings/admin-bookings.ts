import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';

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
  // Adatok
  bookings: any[] = [];
  filteredBookings: any[] = [];
  rooms: any[] = [];
  users: any[] = [];

  // Form és Modál állapotok
  bookingForm!: FormGroup;
  showModal = false;
  showGuestModal = false;
  addMode = true;
  selectedBookingForGuests: any = null;

  // Szűrési feltételek (A HTML-ben ezeket használjuk)
  searchTerm: string = '';
  selectedStatus: string = 'all';
  sortKey: string = 'id';

  constructor(
    private bookApi: AdminBookingService,
    private roomApi: AdminRoomsService,
    private userApi: AdminUserService,
    private guestApi: AdminGuestService,
    private builder: FormBuilder,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadInitialData();
    this.setupUserSync();
  }

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
    });
  }

  get guestArray(): FormArray {
    return this.bookingForm.get('guests') as FormArray;
  }

  get guestControls() {
    return this.guestArray.controls;
  }

  private loadInitialData() {
    this.getBookings();
    this.getRooms();
    this.getUsers();
  }

  // --- API Hívások ---
  getBookings() {
    this.bookApi.getBookings$().subscribe({
      next: (result: any) => {
        this.bookings = (result.data || []).map((b: any) => ({
          ...b,
          isExpanded: false
        }));
        this.applyFilters();
        console.log(result.data)
      },
      error: (err) => console.error('Error loading bookings:', err)
    });
  }

  getRooms() {
    this.roomApi.getRooms$().subscribe({
      next: (res: any) => this.rooms = res.data || [],
      error: (err) => console.error('Error loading rooms:', err)
    });
  }

  getUsers() {
    this.userApi.getUsers$().subscribe({
      next: (res: any) => this.users = res.data || res || [],
      error: (err) => console.error('Error loading users:', err)
    });
  }

  // --- Szűrés és Keresés (Javítva) ---
  applyFilters() {
    let result = [...this.bookings];

    // Keresés ID, Név (guest_name vagy user.name) és Email alapján
    if (this.searchTerm) {
      result = result.filter(b => {
        const s = this.searchTerm.toLowerCase();
        return (
          b.id?.toString().includes(s) ||
          (b.guest_name && b.guest_name.toLowerCase().includes(s)) ||
          (b.user?.name && b.user.name.toLowerCase().includes(s)) ||
          (b.guest_email && b.guest_email.toLowerCase().includes(s)) ||
          (b.user?.email && b.user.email.toLowerCase().includes(s))
        );
      });
    }

    // Státusz szűrő
    if (this.selectedStatus !== 'all') {
      result = result.filter(b => b.status === this.selectedStatus);
    }

    // Rendezés
    if (this.sortKey) {
      result.sort((a, b) => {
        let valA = (this.sortKey === 'room') ? (a.room?.name || '') : (a[this.sortKey]?.toString() || '');
        let valB = (this.sortKey === 'room') ? (b.room?.name || '') : (b[this.sortKey]?.toString() || '');
        return valA.localeCompare(valB);
      });
    }

    this.filteredBookings = result;
  }

  onSort(event: any): void {
    this.sortKey = event.target.value;
    this.applyFilters();
  }

  onSearch(event: any): void {
    this.searchTerm = event.target.value.toLowerCase().trim();
    this.applyFilters();
  }

  // A státusz választóhoz (Status Filter)
  filterByStatus(event: any): void {
    this.selectedStatus = event.target.value;
    this.applyFilters();
  }

  // --- Felhasználó szinkronizáció ---
  private setupUserSync() {
    this.bookingForm.get('user_id')?.valueChanges.subscribe(userId => {
      const nameCtrl = this.bookingForm.get('guest_name');
      const emailCtrl = this.bookingForm.get('guest_email');

      if (userId && userId !== 'null') {
        const selectedUser = this.users.find(u => u.id == userId);
        if (selectedUser) {
          this.bookingForm.patchValue({
            guest_name: selectedUser.name,
            guest_email: selectedUser.email
          }, { emitEvent: false });
          nameCtrl?.disable();
          emailCtrl?.disable();
        }
      } else {
        nameCtrl?.enable();
        emailCtrl?.enable();
      }
    });
  }

  // --- Modál kezelés & Mentés ---
  setShowModal() {
    this.addMode = true;
    this.bookingForm.reset({ 
      status: 'pending', 
      payment_status: 'unpaid',
      guest_count: 1,
      booking_type: 'standard'
    });
    this.guestArray.clear();
    this.showModal = true;
  }

  getForEdit(booking: any) {
    this.addMode = false;
    this.showModal = true;
    this.guestArray.clear();

    const data = { ...booking };
    if (booking.user?.id) data.user_id = booking.user.id;
    if (booking.room?.id) data.room_id = booking.room.id;

    // Dátum formázás input-hoz (YYYY-MM-DD)
    if (data.check_in) data.check_in = new Date(data.check_in).toISOString().split('T')[0];
    if (data.check_out) data.check_out = new Date(data.check_out).toISOString().split('T')[0];

    this.bookingForm.patchValue(data);
  }

  save() {
    if (this.bookingForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: this.translate.instant('ADMIN_ALERTS.FAILED.TITLE_INVALID_FORM'),
        confirmButtonColor: '#2d4037'
      });
      return;
    }
    const formData = this.bookingForm.getRawValue();
    if (this.addMode) {
      this.bookApi.addBooking$(formData).subscribe({
        next: () => this.success(this.translate.instant('ADMIN_ALERTS.SUCCESS.TITLE_CREATE_BOOKING')),
        error: () => this.failed(this.translate.instant('ADMIN_ALERTS.FAILED.TITLE_CREATE_BOOKING'))
      });
    } else {
      this.bookApi.editBooking$(formData, formData.id).subscribe({
        next: () => this.success(this.translate.instant('ADMIN_ALERTS.SUCCESS.TITLE_UPDATE_BOOKING')),
        error: () => this.failed(this.translate.instant('ADMIN_ALERTS.FAILED.TITLE_GENERIC'))
      });
    }
  }

  // --- Vendég kezelés (Visszaállítva) ---
  addGuest(guestData: any = null) {
    const guestGroup = this.builder.group({
      id: [guestData?.id || null],
      first_name: [guestData?.first_name || '', Validators.required],
      last_name: [guestData?.last_name || '', Validators.required],
      birth_date: [guestData?.birth_date || '', Validators.required],
      document_type: [guestData?.document_type || 'id_card', Validators.required], 
      document_number: [guestData?.document_number || '', Validators.required],
      nationality: [guestData?.nationality || ''],
      country_name: [guestData?.country_name || ''],
      city_name: [guestData?.city_name || ''],
      postal_code: [guestData?.postal_code || ''],
      address: [guestData?.address || '', Validators.required]
    });
    
    this.guestArray.push(guestGroup);
  }

  openGuestManager(booking: any) {
    this.selectedBookingForGuests = booking;
    this.showGuestModal = true;
    this.guestArray.clear();
    
    if (booking.guests && booking.guests.length > 0) {
      booking.guests.forEach((g: any) => this.addGuest(g));
    } else {
      const count = booking.guest_count || 1;
      for (let i = 0; i < count; i++) this.addGuest();
    }
  }

  hasExistingGuests(): boolean {
    const guests = this.guestArray.getRawValue();
    return guests.some((g: any) => g.id !== null && g.id !== undefined);
  }

  async saveGuestsOnly() {
    if (this.guestArray.invalid) {
      Swal.fire({
        icon: 'warning',
        title: this.translate.instant('ADMIN_ALERTS.FAILED.TITLE_INVALID_FORM'),
        confirmButtonColor: '#2d4037'
      });
      return;
    }
    const bookingId = this.selectedBookingForGuests.id;
    const guests = this.guestArray.getRawValue();

    try {
      for (const guest of guests) {
        if (guest.id) {
          await firstValueFrom(this.guestApi.editGuest$(bookingId, guest.id, guest));
        } else {
          await firstValueFrom(this.guestApi.addGuest$(bookingId, guest));
        }
      }
      this.success(this.translate.instant('ADMIN_ALERTS.SUCCESS.TITLE_UPDATE_GUESTS'));
      this.showGuestModal = false;
    } catch (err) {
      this.failed(this.translate.instant('ADMIN_ALERTS.FAILED.TITLE_UPDATE_GUESTS'));
    }
  }

  // --- Segédfüggvények ---
  cancel() {
    this.showModal = false;
    this.bookingForm.reset();
    this.guestArray.clear();
  }

  confirmCancel(id: number) {
    Swal.fire({
      title: this.translate.instant('ADMIN_ALERTS.CONFIRM.TITLE_DELETE_BOOKING'),
      text: this.translate.instant('ADMIN_ALERTS.CONFIRM.TEXT_DELETE_BOOKING'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('ADMIN_ALERTS.CONFIRM.CONFIRM_DELETE_BOOKING'),
      cancelButtonText: this.translate.instant('ADMIN_ALERTS.CONFIRM.CANCEL_DELETE_BOOKING'),
      confirmButtonColor: '#2d4037',
      cancelButtonColor: '#6c757d',
    }).then(r => {
      if (r.isConfirmed) {
        this.bookApi.cancelBooking$(id).subscribe({
          next: () => this.success(this.translate.instant('ADMIN_ALERTS.SUCCESS.TITLE_DELETE_BOOKING')),
          error: () => this.failed(this.translate.instant('ADMIN_ALERTS.FAILED.TITLE_DELETE_BOOKING'))
        });
      }
    });
  }

  toggleRow(booking: any) { booking.isExpanded = !booking.isExpanded; }
  deleteGuest(index: number) { this.guestArray.removeAt(index); }
  trackById(index: number, item: any) { return item.id; }

  private success(msg: string) {
    this.getBookings();
    this.showModal = false;
    Swal.fire({
      icon: 'success',      
      title: msg, timer: 2000,
      showConfirmButton: false });
  }

  private failed(message?: string) {
    Swal.fire({ 
      icon: 'error',
      title: message || this.translate.instant('ADMIN_ALERTS.FAILED.TITLE_GENERIC'),
      confirmButtonColor: '#2d4037',
      timer: 2000 });
  }
}