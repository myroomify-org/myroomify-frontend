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

  isSaving = false

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
      error: (error: any) => {
        this.failed(error.message)
      }
    })
  }


  deleteExistingImage(imageId: number, index: number) {
    this.imageApi.deleteImage$(this.roomId, imageId).subscribe({
      next: () => {
        this.existingImages.splice(index, 1)
        this.get(this.roomId)
      },
      error: (error: any) => {
        this.failed(error.message)
      }
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
      return
    }

    this.isSaving = true

    const formData = new FormData()
    formData.append('_method', 'PUT')
    formData.append('name', this.roomForm.value.name)
    formData.append('capacity', this.roomForm.value.capacity.toString())
    formData.append('description', this.roomForm.value.description)
    formData.append('price', this.roomForm.value.price.toString())

    this.roomApi.editRoom$(this.roomId, formData).subscribe({
      next: (response: any) => {
        if (this.selectedFiles.length > 0) {
          this.imageApi.addImages$(this.roomId, this.selectedFiles).subscribe({
            next: (response: any) => {
              this.selectedFiles = []
              this.previews = []
              this.get(this.roomId)
              this.success(response.message)
              this.isSaving = false
            },
            error: (error: any) => {
              this.failed(error.message)
              this.isSaving = false
            }
          })
        } else {
          this.success(response.message)
          this.get(this.roomId)
          this.isSaving = false
        }
      },
      error: (error: any) => {
        this.failed(error.message)
        this.isSaving = false
      }
    })
  }

  // Alerts
  success(title:any) {
    Swal.fire({
      position: "center",
      icon: "success",
      iconColor: "#c3ae80",
      title: title,
      showConfirmButton: false,
      timer: 2500
    });
  }

  unfilledWarning(){
    Swal.fire({
      position: "center",
      icon: "warning",
      title: this.translate.instant("ADMIN_ROOM.WARNING.UNFILLED"),
      showConfirmButton: false,
      timer: 2500
    })
  }

  deleteWarning(imageId: number, index: number) {
    Swal.fire({
      title: this.translate.instant("ADMIN_ROOM.WARNING.DELETE_TITLE"),
      text: this.translate.instant("ADMIN_ROOM.WARNING.DELETE_TEXT"),
      icon: "warning",
      iconColor: "#c3ae80",
      showCancelButton: true,
      confirmButtonColor: "#364e43",
      cancelButtonText: this.translate.instant("ADMIN_ALERTS.CONFIRM.CANCEL_DELETE_IMAGE"),
      confirmButtonText: this.translate.instant("ADMIN_ALERTS.CONFIRM.CONFIRM_DELETE_IMAGE"),
      preConfirm: () => {
        return new Promise((resolve, reject) => {
          this.imageApi.deleteImage$(this.roomId, imageId).subscribe({
            next: () => resolve(true),
            error: (error) => {
              this.failed(error.message);
              reject(error);
            }
          });
        });
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        this.existingImages.splice(index, 1);
        this.get(this.roomId);
        this.success("");
      }
    });
  }

  failed(title: string){
    Swal.fire({
      position: "center",
      icon: "error",
      title: title,
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
