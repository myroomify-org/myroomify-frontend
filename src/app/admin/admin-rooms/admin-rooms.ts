import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AdminRoomsService } from '../../shared/admin/admin-rooms-service';
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

  // Variables
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
    }

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
  // Get
  get() {
    this.roomApi.getRooms$().subscribe({
      next: (result: any) => {
        this.allRooms = result.data;
        this.updateCounts()
        this.filterCards()
        console.log(result.data)
      },
      error: (error: any) => console.error('Error getting rooms', error)
    })
  }

  getRoomMainImage(card: any): string {
    const backendUrl = 'http://localhost:8000/storage/';
    const defaultPlaceholder = 'rooms/room.jpg';

    // 1. Ha nincs images tömb, rögtön placeholder
    if (!card.images || card.images.length === 0) {
      return defaultPlaceholder;
    }

    // 2. LAZA SZŰRÉS: == használata === helyett (szám vs string hiba ellen)
    // És biztosítjuk, hogy az ID-k léteznek
    const roomSpecificImages = card.images.filter((img: any) => 
      img && (img.room_id == card.id)
    );

    // 3. Ha a szűrés után maradt kép:
    if (roomSpecificImages.length > 0) {
      // Megkeressük a primary-t (itt is laza == 1)
      const primaryImage = roomSpecificImages.find((img: any) => 
        img.is_primary == 1 || img.is_primary === true
      );

      // Ha nincs primary, az elsőt vesszük
      const imageToDisplay = primaryImage || roomSpecificImages[0];

      if (imageToDisplay && imageToDisplay.path) {
        // Tisztítjuk a path-t a dupla perjelek ellen
        const cleanPath = imageToDisplay.path.replace(/^\//, '');
        return `${backendUrl}${cleanPath}`;
      }
    }

    // 4. Ha volt kép a tömbben, de a szűrés valamiért elbukott (pl. eltolt ID-k),
    // tegyünk egy utolsó próbát: adjuk vissza a szoba objektum legelső képét szűrés nélkül
    if (card.images[0] && card.images[0].path) {
      const backupPath = card.images[0].path.replace(/^\//, '');
      return `${backendUrl}${backupPath}`;
    }

    return defaultPlaceholder;
  }

  // View
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
    if (!this.canAddRoom()) {
      this.showLimitMessage()
      return
    }

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

