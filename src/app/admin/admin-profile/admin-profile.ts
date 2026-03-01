import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { MeProfileService } from '../../shared/me/me-profile-service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/auth/auth-service';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    MatMenuModule,
    MatButtonModule,
    MatNativeDateModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
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

  hidePassword = true
  user: any = {}
  showPasswordFields: boolean = false
  isSubmitting = false

  constructor(
    private builder: FormBuilder,
    private profileApi: MeProfileService,
    private router: Router,
    private authApi: AuthService
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
    this.isSubmitting = true
    if (this.profileForm.valid) {
      this.profileApi.editProfile$(this.profileForm.getRawValue()).subscribe({
        next: (result: any) => {
          this.success(result.message)
          this.isEditing = false
          this.getProfile()
          this.isSubmitting = false
        },
        error: (error: any) => {
          this.failed(error.message)
          this.isSubmitting = false
        }
      })
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing
    if (!this.isEditing) this.getProfile()
  }

  saveEmail() {
    this.isSubmitting = true
    this.profileApi.editEmail$({ email: this.newEmail }).subscribe({
      next: (result: any) => {
        this.user.email = this.newEmail
        this.success(result.message)
        this.isSubmitting = false
      },
      error: (error: any) => {
        this.failed(error.message)
        this.isSubmitting = false
      }
    })
  }

  savePassword() {
    if (this.passwordData.new_password !== this.passwordData.new_password_confirmation) {
      return
    }

    this.isSubmitting = true

    this.profileApi.editPassword$(this.passwordData).subscribe({
      next: (result: any) => {
        this.showPasswordFields = false
        this.passwordData = { current_password: '', new_password: '', new_password_confirmation: '' }
        this.success(result.message)
        this.isSubmitting = false
        this.router.navigate(['/login'])
        this.authApi.logout$()        
      },
      error: (error: any) => {
        this.failed(error.message)
        this.isSubmitting = false
      }
    })
  }

  success(title: string){ {
    Swal.fire({
      icon: 'success',
      iconColor: '#c3ae80',
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
