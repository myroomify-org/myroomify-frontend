import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AdminRoomsService } from '../shared/admin-rooms-service';

interface CardData {
  id: number,
  image: string,
  title: string,
  about: string
}

@Component({
  selector: 'app-admin-rooms',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './admin-rooms.html',
  styleUrl: './admin-rooms.css',
})


export class AdminRooms {

  cardForm!: any;
  rooms: any;

  cards: CardData[] = []

  nextId: number = 2
  newImage: string = ''

  constructor(
    private build: FormBuilder,
    private roomApi: AdminRoomsService
  ) {}

  ngOnInit(){
    this.getRoom()
    this.cardForm = this.build.group({
      image: [''],
      title: [''],
      about: ['']
    })
  }

  addCard(): void {
    const newCard: CardData = {
      id: this.nextId++,
      image: this.newImage,
      title: this.cardForm.value.title,
      about: this.cardForm.value.about
    }
    
    this.cards.push(newCard)
    this.cardForm.reset()
    this.newImage = ''
  }

  getRoom(){
    this.roomApi.getRooms$().subscribe({
      next: (result: any) => {
        console.log(result)
        this.rooms = result
      },
      error: () => {}
    })
  }

  selectedImage(event: any) {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = () => {
      this.newImage = reader.result as string
    };

    reader.readAsDataURL(file)
  }
}
