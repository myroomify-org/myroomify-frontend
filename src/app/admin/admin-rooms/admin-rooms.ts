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
        capacity: [null],
        is_available: [1],
        price: [null],
        description: ['']
    })
  }

  // Card
  addCard(){
    const cardData = {
      image: this.cardForm.value.image,
      name: this.cardForm.value.name,      
      capacity: Number(this.cardForm.value.capacity),
      description: this.cardForm.value.description,
      price: Number(this.cardForm.value.price),
      is_available: Number(this.cardForm.value.is_available)
    }

    const { image, ...backendPayload } = cardData;
    
    this.cardForm.reset()
  }

  // Crud start
  // read
  get(){
    this.roomApi.getRooms$().subscribe({
      next: (result: any) => {
        console.log(result)
        this.cards = result.data
        this.rooms = result.data     
      },
      error: (err: any) => {
        console.log(err)
      } 
    })
  }

  // Add (C-create)
  // add(data: any) {
  //   this.roomApi.addRoom$(data).subscribe({
  //     next: (result: any) => {
  //       console.log(result)
  //       this.get()
  //       this.showModal = false
  //       this.cardForm.reset()
  //     },
  //     error: (err: any) => {
  //       console.log(err)
  //     }
  //   })
  // }

  // delete
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

  // edit
  edit(id: number) {
    this.router.navigate(['/navbar/room', id])
  }

  // Crud end

  // modal
  setShowModal() {
    this.showModal = true
  }

  cancel(){
    this.showModal = false
    this.cardForm.reset()
  }
}

