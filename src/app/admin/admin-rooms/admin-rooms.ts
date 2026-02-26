import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AdminRoomsService } from '../../shared/admin/admin-rooms-service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface CardData {
  id: number,
  image: string,
  name: string,
  capacity: number,
  description: string,
  price: number,
  status: string,
}

@Component({
  selector: 'app-admin-rooms',
  imports: [ReactiveFormsModule, CommonModule, TranslateModule],
  templateUrl: './admin-rooms.html',
  styleUrl: './admin-rooms.css',
})


export class AdminRooms {
  cardForm!: any
  showModal = false
  cards: CardData[] = []
  isEditing = false
  allRooms: any[] = []

  currentView: 'active' | 'deleted' = 'active'  

  activeCount: number = 0
  deletedCount: number = 0

  constructor(
    private build: FormBuilder,
    private roomApi: AdminRoomsService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(){
    this.get()
    this.initForm()
  }

  private initForm(){
    this.cardForm = this.build.group({
        name: [''],
        capacity: [null],
        is_available: [1],
        price: [null],
        description: ['']
    })
  }

  // read
  get() {
    this.roomApi.getRooms$().subscribe({
      next: (result: any) => {
        this.allRooms = result.data;
        this.updateCounts()
        this.filterCards()
        console.log(result)
      },
      error: (error: any) => console.error('Error getting rooms', error)
    })
  }

  // card
  addCard() {
    if (this.cardForm.invalid) {
      this.failed("TITLE_INVALID_FORM")
      return
    }

    const payload = {
      ...this.cardForm.value,
      capacity: Number(this.cardForm.value.capacity),
      price: Number(this.cardForm.value.price)
    }

    this.roomApi.addRoom$(payload).subscribe({
      next: (response: any) => {
        this.success(response.message)
        this.get()
        this.cancel()
      },
      error: (error: any) => {
        this.failed(error.message)
      }
    })
  }

  delete(id: number) {
    this.roomApi.deleteRoom$(id).subscribe({
      next: (response: any) => {
        this.success(response.message)
        this.get()
      },
      error: (error: any) => {
        this.failed(error.message)
      }
    })
  }

  restoreRoom(id: number) {
    this.roomApi.restoreRoom$(id).subscribe({
      next: (response: any) => {
        this.success(response.message)
        this.get()
      },
      error: (error: any) => {
        this.failed(error.message)
      }
    })
  }

  // images
  getPrimaryImage(card: any): string {
    const backendStorageUrl = 'http://localhost:8000/storage/';
    const defaultPlaceholder = 'rooms/room.jpg';

    if (card.primary_image && card.primary_image.path) {
        return this.formatImagePath(card.primary_image.path, backendStorageUrl);
    }

    if (card.images && card.images.length > 0) {
        const primaryInArray = card.images.find((img: any) => img.is_primary == 1 || img.is_primary === true);
        const imageToDisplay = primaryInArray || card.images[0];
        
        if (imageToDisplay && imageToDisplay.path) {
            return this.formatImagePath(imageToDisplay.path, backendStorageUrl);
        }
    }

    return defaultPlaceholder
  }

  // view and filter
  switchView(view: 'active' | 'deleted') {
    this.currentView = view
    this.filterCards()
  }

  filterCards() {
    if (this.currentView === 'active') {
      this.cards = this.allRooms.filter(room => !room.deleted_at)
    } else {
      this.cards = this.allRooms.filter(room => room.deleted_at)
    }
  }

  updateCounts() {
    this.activeCount = this.allRooms.filter(room => !room.deleted_at).length
    this.deletedCount = this.allRooms.filter(room => room.deleted_at).length
  }

  // assistant
  private formatImagePath(path: string, baseUrl: string): string {
    let cleanPath = path.replace(/^\//, '')
    if (cleanPath.startsWith('public/')) {
        cleanPath = cleanPath.substring(7)
    }
    return `${baseUrl}${cleanPath}`
  }

  canAddRoom(): boolean {
    return true
  }

  edit(id: number) {
    this.router.navigate(['/admin/rooms/', id])
  }

  setShowModal() {
    if (!this.canAddRoom()) {
      this.showLimitMessage()
      return
    }
    this.showModal = true
  }

  cancel(){
    this.showModal = false
    this.cardForm.reset()
  }

  // alerts
  success(title: string) {
    Swal.fire({
      icon: 'success',
      iconColor: '#c3ae80',
      title: title,
      showConfirmButton: false,
      timer: 1500,
      customClass: {
        popup: 'rounded-4 shadow-lg',
        confirmButton: 'rounded-pill px-4',
      }
    })
  }

  failed(key: string) {
    this.translate.get([
      `ADMIN_ALERTS.FAILED.${key}`,
      'ADMIN_ALERTS.FAILED.TEXT_BOOKING_ERROR'
    ]).subscribe(t => {
      Swal.fire({
        icon: 'error',
        title: t[`ADMIN_ALERTS.FAILED.${key}`],
        text: t['ADMIN_ALERTS.FAILED.TEXT_BOOKING_ERROR'],
        confirmButtonColor: '#2d4037'
      });
    });
  }

  confirmDelete(id: number) {
    Swal.fire({
      title: this.translate.instant('ADMIN_ALERTS.CONFIRM.TITLE_DELETE_ROOM'),
      text: this.translate.instant('ADMIN_ALERTS.CONFIRM.TEXT_DELETE_ROOM'),
      icon: "warning",
      iconColor:'#c3ae80',
      showCancelButton: true,
      confirmButtonColor: "#2d4037",
      cancelButtonColor: "#000",
      confirmButtonText: this.translate.instant('ADMIN_ALERTS.CONFIRM.CONFIRM_DELETE_ROOM'),
      cancelButtonText: this.translate.instant('ADMIN_ALERTS.CONFIRM.CANCEL_GENERAL')
    }).then((result) => {
      if (result.isConfirmed) this.delete(id);
    });
  }

  confirmMaintenance(id: number) {
    Swal.fire({
      title: this.translate.instant('ADMIN_ALERTS.CONFIRM.TITLE_MAINTENANCE'),
      text: this.translate.instant('ADMIN_ALERTS.CONFIRM.TEXT_MAINTENANCE'),
      icon: "info",
      iconColor: '#c3ae80',
      showCancelButton: true,
      confirmButtonColor: "#2d4037",
      cancelButtonColor: "#000",
      confirmButtonText: this.translate.instant('ADMIN_ALERTS.CONFIRM.CONFIRM_MAINTENANCE'),
      cancelButtonText: this.translate.instant('ADMIN_ALERTS.CONFIRM.CANCEL_GENERAL')
    }).then((result) => {
      if (result.isConfirmed) this.delete(id)
    })
  }

  showLimitMessage() {
    this.translate.get([
      'ADMIN_ALERTS.INFO.LIMIT_REACHED_TITLE',
      'ADMIN_ALERTS.INFO.LIMIT_REACHED_TEXT'
    ]).subscribe(t => {
      Swal.fire({
        icon: 'info',
        iconColor: '#c3ae80',
        title: t['ADMIN_ALERTS.INFO.LIMIT_REACHED_TITLE'],
        text: t['ADMIN_ALERTS.INFO.LIMIT_REACHED_TEXT'],
        confirmButtonColor: '#2d4037'
      });
    });
  }
}

