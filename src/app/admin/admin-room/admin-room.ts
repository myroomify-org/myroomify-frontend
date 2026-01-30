import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminRoomsService } from '../../shared/admin/admin-rooms-service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-room',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './admin-room.html',
  styleUrl: './admin-room.css',
})
export class AdminRoom implements OnInit{
  [x: string]: any

  roomId!: number
  roomForm: any

  showModal = false
  selectedFile: File | null = null
  mainImageUrl: string = ''

  constructor(
    private builder: FormBuilder,
    private roomApi: AdminRoomsService,
    private activated: ActivatedRoute,
    private router: Router  
  ){}

  ngOnInit(): void {
    this.initForm()
    this.activated.paramMap.subscribe(params => {
      const id = params.get('id')
      if(id){
        this.roomId = +id
        this.get(this.roomId)
      }
    })
  }

  // Page
  private initForm() {
    this.roomForm = this.builder.group({
      name: [''],
      capacity: [null],
      description: [''],
      price: [null],
    })
  }

  // Crud start
  // read
  get(id:number){
    this.roomApi.getRoom$(id).subscribe({
      next: (result: any) => {
        this.roomForm.patchValue({
          name: result.data.name,
          capacity: result.data.capacity,
          description: result.data.description,
          price: result.data.price,
        })
      },
      error: (err) => {
        console.error(err)
      }
    })
  }

  // edit
  edit() {
    if (this.roomForm.invalid) {
      Swal.fire('Hiba', 'Kérlek tölts ki minden kötelező mezőt!', 'warning')
      return
    }

    const payload = {
      name: this.roomForm.value.name,
      capacity: Number(this.roomForm.value.capacity),
      description: this.roomForm.value.description,
      price: Number(this.roomForm.value.price),
      is_available: Number(this.roomForm.value.is_available),
      image: null
    }

    console.log(payload)

    this.roomApi.editRoom$(this.roomId, payload).subscribe({
      next: () => this.success(),
      error: err => {
        this.failed()
      }
    })
  }
  //Crud end


  // Alerts
  success(){
    Swal.fire({
      position: "center",
      icon: "success",
      title: "Your room has been updated",
      showConfirmButton: false,
      timer: 2500
    })
  }

  failed(){
    Swal.fire({
      position: "center",
      icon: "error",
      title: "Oops, something went wrong",
      showConfirmButton: false,
      timer: 2500
    })
  }

  // Navigation
  confirmNavigate(){
    Swal.fire({
      title: "Are you sure?",
      text: "Unsaved changes will be lost!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#364e43",
      cancelButtonColor: "rgba(0, 0, 0, 1)",
      confirmButtonText: "Go back to rooms"
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['admin/rooms'])
      }
    })
  }
}
