import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { AdminUserService } from '../../shared/admin/admin-user-service';
import { CommonModule } from '@angular/common';
import { MeProfileService } from '../../shared/me/me-profile-service';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule
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
      next: (res: any) => {
        this.user = res.data
        const d = res.data
        this.profileForm.patchValue({
          name: d.name,
          email: d.email,
          first_name: d.profile?.first_name,
          last_name: d.profile?.last_name,
          phone: d.profile?.phone,
          country_name: d.profile?.address?.city?.country?.name,
          city_name: d.profile?.address?.city?.name,
          address: d.profile?.address?.address,
          postal_code: d.profile?.address?.postal_code,
        })
      }
    })
  }

  saveProfile() {
    if (this.profileForm.valid) {
      this.profileApi.editProfile$(this.profileForm.getRawValue()).subscribe({
        next: () => {
          this.success("Profile updated!")
          this.isEditing = false
          this.getProfile()
        },
        error: () => this.failed("Update failed")
      });
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
        this.success("Email updated successfully")
      },
      error: (error:any) => this.failed("Email update failed")
    });
  }

  savePassword() {
    if (this.passwordData.new_password !== this.passwordData.new_password_confirmation) {
      Swal.fire('Error', 'The new passwords do not match!', 'error')
      return
    }

    this.profileApi.editPassword$(this.passwordData).subscribe({
      next: () => {
        this.showPasswordFields = false
        this.passwordData = { current_password: '', new_password: '', new_password_confirmation: '' }
        this.success("Password updated successfully")
      },
      error: (error:any) => this.failed("Password update failed")
    })
  }

  success(text: string){ {
    Swal.fire({
      icon: 'success',
      title: text,
      showConfirmButton: false,
      timer: 1500
    })
    }
  }

  failed(text: string){
    Swal.fire({
      position: "center",
      icon: "error",
      title: text,
      showConfirmButton: false,
      timer: 2500
    })
  }
}
