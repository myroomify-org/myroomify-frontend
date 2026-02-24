import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { MeProfileService } from '../../shared/me/me-profile-service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './admin-profile.html',
  styleUrl: './admin-profile.css',
})
export class AdminProfile implements OnInit{
  activeTab = 'details'
  profileForm!: FormGroup
  adminData: any
  isEditing = false

  newEmail = ''
  passwordData = {
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  }

  user: any = {}

  showPasswordFields: boolean = false

  constructor(
    private builder: FormBuilder,
    private profileApi: MeProfileService,
    private translate: TranslateService
  ) {}

  ngOnInit() {   
    this.profileForm = this.builder.group({
      name: [{value: '', disabled: true}],
      email: ['', [Validators.required, Validators.email]],
      last_name: ['', Validators.required],
      first_name: ['', Validators.required],
      country_name: ['', Validators.required],
      city_name: ['', Validators.required],
      address: ['', Validators.required],
      postal_code: ['', Validators.required],
      phone: ['']
    })

    this.getProfile()
  }

  getProfile() {
    this.profileApi.getProfile$().subscribe({
      next: (result: any) => {
        this.user = result.data
        const user = result.data
        this.profileForm.patchValue({
          name: user.name,
          email: user.email,
          first_name: user.profile?.first_name,
          last_name: user.profile?.last_name,
          phone: user.profile?.phone,
          country_name: user.profile?.address?.city?.country?.name,
          city_name: user.profile?.address?.city?.name,
          address: user.profile?.address?.address,
          postal_code: user.profile?.address?.postal_code,
        })
      }
    })
  }

  saveProfile() {
    if (this.profileForm.valid) {
      this.profileApi.editProfile$(this.profileForm.getRawValue()).subscribe({
        next: () => {
          this.success(this.translate.instant("GUEST_ALERTS.SUCCESS.TITLE_PROFILE_UPDATE"))
          this.isEditing = false
          this.getProfile()
        },
        error: () => {
          this.failed(this.translate.instant("GUEST_ALERTS.FAILED.TITLE_PROFILE_UPDATE"))
        }
      })
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing
    if (!this.isEditing) this.getProfile()
  }

  saveEmail() {
    this.profileApi.editEmail$({ email: this.newEmail }).subscribe({
      next: () => {
        this.user.email = this.newEmail
        this.success(this.translate.instant("GUEST_ALERTS.SUCCESS.TITLE_EMAIL_UPDATE"))
      },
      error: () => {
        this.failed(this.translate.instant("GUEST_ALERTS.FAILED.TITLE_EMAIL_UPDATE"))
      }
    })
  }

  savePassword() {
    if (this.passwordData.new_password !== this.passwordData.new_password_confirmation) {
      this.failed(this.translate.instant("GUEST_ALERTS.FAILED.TITLE_PASSWORD_CONFIRM"))
      return
    }

    this.profileApi.editPassword$(this.passwordData).subscribe({
      next: () => {
        this.showPasswordFields = false
        this.passwordData = { current_password: '', new_password: '', new_password_confirmation: '' }
        this.success(this.translate.instant("GUEST_ALERTS.SUCCESS.TITLE_PASSWORD_CHANGE"))
      },
      error: () => {
        this.failed(this.translate.instant("GUEST_ALERTS.FAILED.TITLE_PASSWORD_CHANGE"))
      }
    })
  }

  success(title: string){ {
    Swal.fire({
      icon: 'success',
      title: title,
      showConfirmButton: false,
      timer: 1500
    })
    }
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
}
