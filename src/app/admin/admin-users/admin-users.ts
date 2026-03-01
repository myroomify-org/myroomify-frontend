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
  id: string
  name: string
  email: string
  phone: string
  password: string
  password_confirmation: string
  role: UserRole
  first_name?: string
  last_name?: string
  address?: string
  city_name?: string
  country_name?: string
  postal_code?: string
  is_active: number
  deleted_at?: string | null
}

const ROLE_PRIORITY: Record<UserRole, number> = {
  superadmin: 0,
  admin: 1,
  receptionist: 2,
  customer: 3,
}

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
  
  // Filters
  currentFilter: 'active' | 'inactive' | 'deleted' = 'active'
  searchTerm: string = ''
  isSubmitting = false

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
    const rawUser = localStorage.getItem('user')
    if (rawUser) {
      const parsed = JSON.parse(rawUser)
      this.currentAdminId = parsed.id ? Number(parsed.id) : null
    }
  }

  // READ
  getUsers(): void {
    this.userApi.getUsers$().subscribe({
      next: (result: any) => {
        this.users = result.data.sort((a: User, b: User) =>
          (ROLE_PRIORITY[a.role] ?? 4) - (ROLE_PRIORITY[b.role] ?? 4)
        )
        this.applyFilters()
      },
      error: (error:any) => {
        console.log(error)
      }
    })
  }

  // Create
  addUser(): void {
    const formValue = this.userForm.getRawValue()

    this.isSubmitting = true

    const payload: User = {
      ...formValue,
      password_confirmation: formValue.password
    }

    this.userApi.addUser$(payload).subscribe({
      next: (result: any) => {
        this.success(result.message)
        this.getUsers()
        this.cancel()
        this.isSubmitting = false
      },
      error: (error:any) => {
        console.log(error)
        this.failed(error.message)
        this.isSubmitting = false
      }
    })
  }

  // Update role
  changeRole(user: User, newRole: string): void {
    if (!newRole) return

    const payload = { role: newRole as UserRole }

    this.userApi.changeRole$(+user.id, payload).subscribe({
      next: (result: any) => {
        user.role = newRole as UserRole
        this.success(result.message)
      },
      error: (error: any) => {
        this.failed(error.message)
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
    }
  }

  isStaff(role: UserRole | undefined): boolean {
    return role ? this.staffRoles.includes(role) : false
  }

  toggleUserStatus(user: User): void {
    const isCurrentlyActive = !!user.is_active
    
    const statusRequest$ = isCurrentlyActive 
      ? this.userApi.deactivate$(+user.id, {}) 
      : this.userApi.activate$(+user.id, {})

    statusRequest$.subscribe({
      next: (result: any) => {      
        this.success(result.message)
        user.is_active = isCurrentlyActive ? 0 : 1;
        this.applyFilters();
      },
      error: (error: any) => {
        this.failed(error.message)
      }
    })
  }

  // delete
  private deleteUser(id: number): void {
    this.userApi.deleteUser$(id).subscribe({
      next: (result: any) => {
        this.getUsers()
        this.success(result.message)
      },
      error: (error: any) => {
        this.failed(error.message)
      }
    })
  }

  // Restore
  restoreUser(id: number): void {
    this.userApi.restoreUser$(id).subscribe({
      next: (result: any) => {
        this.getUsers()
        this.success(result.message)
      },
      error: (error: any) => {
        this.failed(error.message)
      }
    })
  }

  // Search
  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value.toLowerCase()
    this.applyFilters()
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

  filterByStatus(status: 'active' | 'inactive' | 'deleted') {
    this.currentFilter = status;
    this.applyFilters()
  }

  applyFilters(): void {
    const term = this.searchTerm || ''

    this.filteredUsers = this.users.filter(user => {
      const matchesStatus = 
        this.currentFilter === 'active' ? (user.is_active && !user.deleted_at) :
        this.currentFilter === 'inactive' ? (!user.is_active && !user.deleted_at) :
        this.currentFilter === 'deleted' ? !!user.deleted_at : false

      const matchesSearch = 
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.id.toString().includes(term)

      return matchesStatus && matchesSearch
    });
  }
  
  // Modal
  setShowModal(): void {
    this.showModal = true
  }

  cancel(): void {
    this.isSubmitting = false
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

  confirmDelete(id: number): void {
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

  confirmChangeRole(user: User, newRole: string): void {
    Swal.fire({
      title: this.translate.instant('ADMIN_ALERTS.CONFIRM.TITLE_CHANGE_ROLE'),
      text: `${this.translate.instant('ADMIN_ALERTS.CONFIRM.TEXT_CHANGE_ROLE')}`,
      icon: 'question',
      iconColor: '#c3ae80',
      showCancelButton: true,
      confirmButtonColor: '#2d4037',
      cancelButtonText: this.translate.instant('ADMIN_USERS.BUTTONS.CANCEL')
    }).then(result => {
      if (result.isConfirmed) {
        this.changeRole(user, newRole)
      } else {
        this.getUsers()
      }
    })
  }

  confirmToggleStatus(user: User): void {
    const titleKey = user.is_active ? 'ADMIN_ALERTS.CONFIRM.TITLE_DEACTIVATE_USER' : 'ADMIN_ALERTS.CONFIRM.TITLE_ACTIVATE_USER';
    
    Swal.fire({
      title: this.translate.instant(titleKey),
      icon: 'warning',
      iconColor: '#c3ae80',
      showCancelButton: true,
      confirmButtonColor: '#2d4037',
      cancelButtonText: this.translate.instant('ADMIN_USERS.BUTTONS.CANCEL')
    }).then(result => {
      if (result.isConfirmed) {
        this.toggleUserStatus(user)
      }
    })
  }

  confirmRestore(id: number): void {
    Swal.fire({
      title: this.translate.instant('ADMIN_ALERTS.CONFIRM.TITLE_RESTORE_USER'),
      text: this.translate.instant('ADMIN_ALERTS.CONFIRM.TEXT_RESTORE_USER'),
      icon: 'info',
      iconColor: '#c3ae80',
      showCancelButton: true,
      confirmButtonColor: '#2d4037',
      cancelButtonText: this.translate.instant('ADMIN_USERS.BUTTONS.CANCEL')
    }).then(result => {
      if (result.isConfirmed) {
        this.restoreUser(id)
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