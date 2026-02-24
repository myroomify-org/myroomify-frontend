import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminUserService } from '../../shared/admin/admin-user-service';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

type UserRole = 'superadmin' | 'admin' | 'receptionist' | 'customer';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  address?: string;
  city_name?: string;
  country_name?: string;
  postal_code?: string;
  is_active: number;
  deleted_at?: string | null;
}

const ROLE_PRIORITY: Record<UserRole, number> = {
  superadmin: 0,
  admin: 1,
  receptionist: 2,
  customer: 3,
};

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule
  ],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.css']
})
export class AdminUsers implements OnInit {
  private readonly builder = new FormBuilder()

  showModal = false
  users: User[] = []
  filteredUsers: User[] = []
  currentAdminId: number | null = null
  private staffRoles: UserRole[] = ['superadmin', 'admin', 'receptionist']

  userForm = this.builder.nonNullable.group({
    id: [''],
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['00000000000', Validators.required],
    password: ['', Validators.required],
    password_confirmation: [''],
    role: ['customer' as UserRole, Validators.required],
    first_name: ['Guest', Validators.required],
    last_name: ['User', Validators.required],
    address: ['Temporary Address', Validators.required],
    city_name: ['Budapest', Validators.required],
    country_name: ['Hungary', Validators.required],
    postal_code: ['0000', Validators.required],
    is_active: [1]
  })

  constructor(
    private userApi: AdminUserService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser()
    this.getUsers()
  }

  private loadCurrentUser(): void {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      this.currentAdminId = parsed.id ? Number(parsed.id) : null
    }
  }

  // READ
  getUsers(): void {
    this.userApi.getUsers$().subscribe({
      next: (result: any) => {
        const activeUsers: User[] = result.data
          .filter((user: User) => !user.deleted_at)
          .sort((a: User, b: User) =>
            (ROLE_PRIORITY[a.role] ?? 4) - (ROLE_PRIORITY[b.role] ?? 4)
          )

        this.users = activeUsers
        this.filteredUsers = [...activeUsers]
      },
      error: (error:any) => {
        console.log(error)
      }
    })
  }

  // CREATE
  addUser(): void {
    const formValue = this.userForm.getRawValue()

    const payload: User = {
      ...formValue,
      password_confirmation: formValue.password
    }

    this.userApi.addUser$(payload).subscribe({
      next: () => {
        this.success(this.translate.instant('ADMIN_ALERTS.SUCCESS.TITLE_CREATE_USER'))
        this.getUsers()
        this.cancel()
      },
      error: (error:any) => {
        console.log(error)
        this.failed(this.translate.instant('ADMIN_ALERTS.FAILED.TITLE_CREATE_USER'))
      }
    })
  }

  // UPDATE ROLE
  changeRole(user: User, newRole: string): void {
    if (!newRole) return

    const updatedUser = { ...user, role: newRole as UserRole }
    const payload = this.preparePayload(updatedUser)

    this.userApi.editUser$(+user.id, payload).subscribe({
      next: () => {
        user.role = newRole as UserRole;
        this.success(this.translate.instant('ADMIN_ALERTS.SUCCESS.TITLE_CHANGE_ROLE'))
      },
      error: () => {
        this.failed(this.translate.instant('ADMIN_ALERTS.FAILED.TITLE_CHANGE_ROLE'))
      }
    })
  }

  private preparePayload(user: User): any {
    const nameParts = (user.name || '').trim().split(' ')
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      phone: user.phone || '00000000000',
      first_name: user.first_name || nameParts[0] || 'Guest',
      last_name: user.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User'),
      country_name: user.country_name || 'Hungary',
      city_name: user.city_name || 'Budapest',
      address: user.address || 'Temporary Address',
      postal_code: user.postal_code || '0000',
      password: '',
      password_confirmation: ''
    };
  }

  isStaff(role: UserRole | undefined): boolean {
    return role ? this.staffRoles.includes(role) : false
  }

  toggleUserStatus(user: User): void {
    const updatedStatus = user.is_active ? 0 : 1
    const updatedUser = { ...user, is_active: updatedStatus }
    const payload = this.preparePayload(updatedUser)

    this.userApi.editUser$(+user.id, payload).subscribe({
      next: () => {
        user.is_active = updatedStatus
        this.success(
          updatedStatus
            ? this.translate.instant('ADMIN_ALERTS.SUCCESS.ACTIVATED')
            : this.translate.instant('ADMIN_ALERTS.SUCCESS.DEACTIVATED')
        )
      },
      error: () => {
        this.failed(this.translate.instant('ADMIN_ALERTS.FAILED.TITLE_DEACTIVATE_USER'))
      }
    })
  }

  // DELETE
  private deleteUser(id: number): void {
    this.userApi.deleteUser$(id).subscribe({
      next: () => {
        this.getUsers()
        this.success(this.translate.instant('ADMIN_ALERTS.SUCCESS.TITLE_DELETE_USER'))
      },
      error: () => {
        this.failed(this.translate.instant('ADMIN_ALERTS.FAILED.TITLE_DELETE_USER'))
      }
    })
  }

  // Search
  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase()

    this.filteredUsers = this.users.filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.id.toString().includes(term)
    )
  }

  onSort(event: Event): void {
    const key = (event.target as HTMLSelectElement).value
    if (!key) return

    this.filteredUsers.sort((a, b) => {
      let valA: any = (a as any)[key]
      let valB: any = (b as any)[key]

      if (typeof valA === 'string') valA = valA.toLowerCase()
      if (typeof valB === 'string') valB = valB.toLowerCase()

      if (valA < valB) return -1
      if (valA > valB) return 1
      return 0
    })
  }

 
  // Modal
  setShowModal(): void {
    this.showModal = true
  }

  cancel(): void {
    this.showModal = false
    this.userForm.reset({
      id: '',
      name: '',
      email: '',
      phone: '00000000000',
      password: '',
      password_confirmation: '',
      role: 'customer',
      first_name: 'Guest',
      last_name: 'User',
      address: 'Temporary Address',
      city_name: 'Budapest',
      country_name: 'Hungary',
      postal_code: '0000',
      is_active: 1
    })
  }


  // Alerts
  success(title: string){
    Swal.fire({
      icon: 'success',
      iconColor: '#c3ae80',
      title: title,
      timer: 1500,
      showConfirmButton: false
    })
  }

  confirm(id: number): void {
    Swal.fire({
      title: this.translate.instant('ADMIN_ALERTS.CONFIRM.TITLE_DELETE_USER'),
      text: this.translate.instant('ADMIN_ALERTS.CONFIRM.TEXT_DELETE_USER'),
      icon: 'warning',
      iconColor: '#c3ae80',
      showCancelButton: true,
      confirmButtonColor: '#2d4037',
    }).then(result => {
      if (result.isConfirmed) {
        this.deleteUser(id)
      }
    })
  }

  failed(title: string){
    Swal.fire({
      icon: 'error',
      title: title,
      timer: 2000,
      showConfirmButton: false
    })
  }
}