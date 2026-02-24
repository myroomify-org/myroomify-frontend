import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminRoomsService } from '../../shared/admin/admin-rooms-service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { AdminImageService } from '../../shared/admin/admin-image-service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-admin-room',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    TranslateModule,
    RouterModule
  ],
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
    private imageApi: AdminImageService,
    private activated: ActivatedRoute,
    private router: Router,
    private translate: TranslateService
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

  // page
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

  // images
  getMainImagePath(): string {
    const mainImage = this.existingImages.find(img => img.is_primary) || this.existingImages[0]    
    if (!mainImage) return '/rooms/room.jpg'
    
    const baseUrl = 'http://localhost:8000/storage'
    return mainImage.path.startsWith('/') ? `${baseUrl}${mainImage.path}` : `${baseUrl}/${mainImage.path}`
  }

  setAsMain(imageId: number) {
    this.imageApi.setPrimary$(this.roomId, imageId).subscribe({
      next: () => {
        this.existingImages.forEach(img => img.is_primary = (img.id === imageId))
      },
      error: () => this.failed()
    })
  }


  deleteExistingImage(imageId: number, index: number) {
    this.imageApi.deleteImage$(this.roomId, imageId).subscribe({
      next: () => {
        this.existingImages.splice(index, 1)
        this.get(this.roomId)
      },
      error: () => this.failed()
    })
  }
 
  getImageUrl(path: string): string {
    if (!path) return ''
    return `http://localhost:8000/storage/${path}`
  }

  // file management
  onFileDropped(event: DragEvent) {
    event.preventDefault()    
    if (event.dataTransfer?.files.length) {
      this.handleFiles(event.dataTransfer.files)
    }
  }

  onFilesSelected(event: any) {
    const input = event.target as HTMLInputElement
      if (input.files?.length) {
        this.handleFiles(input.files)
      }
  }

  private handleFiles(files: FileList) {
    Array.from(files).forEach(file => {
      if (file.type.match('image.*')) {
        this.selectedFiles.push(file)
        const reader = new FileReader()

        reader.onload = (event) => {
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
      this.unfilledWarning()
    }

    const formData = new FormData()
    formData.append('_method', 'PUT')
    formData.append('name', this.roomForm.value.name)
    formData.append('capacity', this.roomForm.value.capacity.toString())
    formData.append('description', this.roomForm.value.description)
    formData.append('price', this.roomForm.value.price.toString())

    this.roomApi.editRoom$(this.roomId, formData).subscribe({
      next: () => {
        if (this.selectedFiles.length > 0) {
          this.imageApi.addImages$(this.roomId, this.selectedFiles).subscribe({
            next: () => {
              this.selectedFiles = []
              this.previews = []
              this.get(this.roomId)
              this.success()
            },
            error: () => this.failed()
          })
        } else {
          this.success()
          this.get(this.roomId)
        }
      },
      error: () => this.failed()
    })
  }

  // Alerts
  success() {
    this.translate.get('ADMIN_ALERTS.SUCCESS.TITLE_UPDATE_ROOM').subscribe(msg => {
      Swal.fire({
        position: "center",
        icon: "success",
        iconColor: "#c3ae80",
        title: msg,
        showConfirmButton: false,
        timer: 2500
      });
    });
  }

  unfilledWarning(){
    Swal.fire({
      position: "center",
      icon: "warning",
      title: "Please fill in all required fields!",
      showConfirmButton: false,
      timer: 2500
    })
  }

  deleteWarning(imageId: number, index: number) {
    Swal.fire({
      title: "Are you sure?",
      text: "This will delete the image from the server immediately.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#364e43",
      confirmButtonText: "Yes, delete it!"
    }).then (() => {
      this.deleteExistingImage(imageId, index)
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
  confirmNavigate() {
    if (this.roomForm.dirty || this.selectedFiles.length > 0) {
      this.translate.get([
        'ADMIN_ALERTS.CONFIRM.TITLE_NAVIGATE',
        'ADMIN_ALERTS.CONFIRM.TEXT_NAVIGATE',
        'ADMIN_ALERTS.CONFIRM.CONFIRM_NAVIGATE',
        'ADMIN_ALERTS.CONFIRM.CANCEL_GENERAL'
      ]).subscribe(t => {
        Swal.fire({
          title: t['ADMIN_ALERTS.CONFIRM.TITLE_NAVIGATE'],
          text: t['ADMIN_ALERTS.CONFIRM.TEXT_NAVIGATE'],
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#364e43",
          cancelButtonColor: "rgba(0, 0, 0, 1)",
          confirmButtonText: t['ADMIN_ALERTS.CONFIRM.CONFIRM_NAVIGATE'],
          cancelButtonText: t['ADMIN_ALERTS.CONFIRM.CANCEL_GENERAL']
        }).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['admin/rooms']);
          }
        });
      });
    } else {
      this.router.navigate(['admin/rooms']);
    }
  }
}
