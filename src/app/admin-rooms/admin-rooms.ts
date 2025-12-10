import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AdminRoomsService } from '../shared/admin-rooms-service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

interface CardData {
  id: number,
  image: string,
  name: string,
  capacity: number,
  description: string,
  price: number,
  equipment: string,
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

  constructor(
    private build: FormBuilder,
    private roomApi: AdminRoomsService,
    private router: Router
  ) {}

  ngOnInit(){
    this.get()
    this.cardForm = this.build.group({
        name: [''],
        description: ['']
    })
  }

  // Card
  addCard(){
    const cardData = {
      image: "/local/rooms/birka.webp",
      name: this.cardForm.value.name,      
      capacity: 10,
      description: this.cardForm.value.description,
      price: 500.3,
      equipment: 'Wifi, TV', 
      status: 'available'
    }

    const { image, ...backendPayload } = cardData;
    
    this.add(backendPayload)
    this.cardForm.reset()
  }

  // Get (R-read)
  get(){
    this.roomApi.getRooms$().subscribe({
      next: (result: any) => {
        console.log(result)
        this.cards = result
        this.rooms = result        
      },
      error: (err: any) => {
        console.log(err)
      } 
    })
  }

  // Add (C-create)
  add(data: any) {
    this.roomApi.addRoom$(data).subscribe({
      next: (result: any) => {
        console.log(result)
        this.get()
        this.showModal = false
      },
      error: (err: any) => {
        console.log(err)
      }
    })
  }

  // Delete (D)
  delete(id: number) {
    this.roomApi.deleteRoom$(id).subscribe({
      next: (result: any) => {
        console.log(result)
        this.cards = this.cards.filter((card: CardData) => card.id !== id)
        this.get()
        Swal.fire({
          position: "center",
          icon: "success",
          title: "Your room has been deleted",
          showConfirmButton: false,
          timer: 2500
        });
      },
      error: (err: any) => {
        Swal.fire({
          position: "center",
          icon: "error",
          title: "Oops, something went wrong",
          showConfirmButton: false,
          timer: 2500
        });
      }
    })
  }

  confirmDelete(id: number){
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#bb5127",
      cancelButtonColor: "rgba(0, 0, 0, 1)",
      confirmButtonText: "Delete"
    }).then((result) => {
      if (result.isConfirmed) {
        this.delete(id)
      }
    });
  }

  // Edit (U)
  edit(id: number) {
    this.router.navigate(['/navbar/room', id])
  }

  // Modal
  setShowModal() {
    this.showModal = true
  }

  cancel(){
    this.showModal = false
    this.cardForm.reset()
  }
}

