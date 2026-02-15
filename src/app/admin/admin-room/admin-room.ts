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
  roomId!: number
  roomForm: any

  showModal = false
  selectedFiles: File[] = []
  previews: string[] = []
  existingImages: any[] = []

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

        this.existingImages = result.data.images || []
      },
      error: (error) => {
        console.error(error)
      }
    })
  }

  getMainImagePath(): string {
    const mainImage = this.existingImages.find(img => img.is_primary) || this.existingImages[0]
    
    if (!mainImage) return '/rooms/room.jpg'
    const path = mainImage.path

    if (path.startsWith('data:')) return path
    const baseUrl = 'http://localhost:8000/storage'
    return path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`
  }

  setAsMain(imageId: number) {
    this.existingImages.forEach(img => {
      img.is_primary = (img.id === imageId)
    })
  }

  deleteExistingImage(imageId: number, index: number) {
    this.existingImages.splice(index, 1)
    
    if (this.existingImages.length > 0 && !this.existingImages.some(img => img.is_primary)) {
      this.existingImages[0].is_primary = true
    }
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    
    const backendBaseUrl = 'http://localhost:8000'
    
    return `${backendBaseUrl}/storage/${path}`
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault()
    
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const files = event.dataTransfer.files;
      this.handleFiles(files)
    }
  }

  onFilesSelected(event: any) {
    const input = event.target as HTMLInputElement
      if (input.files && input.files.length > 0) {
        this.handleFiles(input.files)
      }
  }

  private handleFiles(files: FileList) {
    Array.from(files).forEach(file => {
      if (file.type.match('image.*')) {
        this.selectedFiles.push(file)

        const reader = new FileReader()
        reader.onload = (event: ProgressEvent<FileReader>) => {
          if (event.target?.result) {
            this.previews.push(event.target.result as string)
          }
        };
        reader.readAsDataURL(file)
      }
    })
  }

  removeSelectedFile(index: number) {
    this.selectedFiles.splice(index, 1)
    this.previews.splice(index, 1)
  }

  // update
  edit() {
    if (this.roomForm.invalid) {
      Swal.fire('Warning', 'Please fill in all required fields!', 'warning')
      return
    }

    const formData = new FormData()

    formData.append('_method', 'PUT')

    formData.append('name', this.roomForm.value.name)
    formData.append('capacity', this.roomForm.value.capacity.toString())
    formData.append('description', this.roomForm.value.description)
    formData.append('price', this.roomForm.value.price.toString())

    this.existingImages.forEach((img, index) => {
      formData.append(`existing_images[${index}][id]`, img.id.toString())
      formData.append(`existing_images[${index}][is_primary]`, img.is_primary ? '1' : '0')
    })

    this.selectedFiles.forEach((file) => {
      formData.append('images[]', file, file.name)
    })

    this.roomApi.editRoom$(this.roomId, formData).subscribe({
      next: () => {
        this.success(),
        this.selectedFiles = []
        this.previews = []
        this.get(this.roomId)
      },
      error: error => {
        this.failed()
      }
    })
  }

  // Alerts
  success(){
    Swal.fire({
      position: "center",
      icon: "success",
      iconColor: "#c3ae80",
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
