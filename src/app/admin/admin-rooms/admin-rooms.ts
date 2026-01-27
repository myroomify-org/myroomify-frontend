import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AdminRoomsService } from '../../shared/admin-rooms-service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

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
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './admin-rooms.html',
  styleUrl: './admin-rooms.css',
})


export class AdminRooms {

  cardForm!: any
  rooms: any
  showModal = false
  cards: CardData[] = []
  isEditing = false

  currentView: 'active' | 'deleted' = 'active'
  allRooms: any[] = []
  card: any[] = []

  activeCount: number = 0
  deletedCount: number = 0

  constructor(
    private build: FormBuilder,
    private roomApi: AdminRoomsService,
    private router: Router
  ) {}

  ngOnInit(){
    this.get()
    this.cardForm = this.build.group({
        name: [''],
        capacity: [null],
        is_available: [1],
        price: [null],
        description: ['']
    })
  }

  // Card
  addCard() {
    if (this.cardForm.invalid) {
      this.failed("Please fill all required fields correctly.")
      return
    }

    const payload = {
      ...this.cardForm.value,
      capacity: Number(this.cardForm.value.capacity),
      price: Number(this.cardForm.value.price)
    };

    this.roomApi.addRoom$(payload).subscribe({
      next: (result: any) => {
        this.success("Room added successfully!")
        this.get()
        this.cancel()
      },
      error: (error: any) => this.failed("Failed to add room.")
    })
  }

  // Crud start
  // read
  get() {
    this.roomApi.getRooms$().subscribe({
      next: (result: any) => {
        this.allRooms = result.data;
        this.updateCounts()
        this.filterCards()
      },
      error: (err: any) => console.error('Error getting rooms', err)
    })
  }

  switchView(view: 'active' | 'deleted') {
    this.currentView = view
    this.filterCards()
  }

  filterCards() {
    if (this.currentView === 'active') {
      this.cards = this.allRooms.filter(r => !r.deleted_at)
    } else {
      this.cards = this.allRooms.filter(r => r.deleted_at)
    }
  }

  updateCounts() {
    this.activeCount = this.allRooms.filter(r => !r.deleted_at).length
    this.deletedCount = this.allRooms.filter(r => r.deleted_at).length
  }

  restoreRoom(id: number) {
    this.roomApi.restoreRoom$(id).subscribe({
      next: (res: any) => {
        this.success('Room restored successfully')
        this.get()
      },
      error: (err: any) => {
        this.failed('Error restoring room')
      }
    })
  }

  canAddRoom(): boolean {
    return this.allRooms.length < 20
  }

  // delete
  delete(id: number) {
    this.roomApi.deleteRoom$(id).subscribe({
      next: () => {
        this.cards = this.cards.filter(c => c.id !== id)
        this.success("Room deleted successfully")
        this.get()
      },
      error: () => this.failed("Delete failed")
    })
  }

  confirmDelete(id: number) {
    Swal.fire({
      title: "Are you sure?",
      text: "This room will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2d4037",
      cancelButtonColor: "#000",
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) this.delete(id)
    })
  }

  // edit
  edit(id: number) {
    this.router.navigate(['/admin/rooms/', id])
  }

  // Crud end

  // modal
  setShowModal() {
    this.showModal = true
  }

  showLimitMessage() {
    Swal.fire({
      icon: 'info',
      title: 'Limit reached',
      text: 'You have reached the maximum of 20 rooms. Please restore a deleted room or edit an existing one.',
      confirmButtonColor: '#2d4037'
    })
  }

  cancel(){
    this.showModal = false
    this.cardForm.reset()
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
      text: 'Your booking could not be completed.',
      confirmButtonColor: '#2d4037'
    })
  }
}

