import { Component } from '@angular/core';
import Swal from 'sweetalert2';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminUserService } from '../../shared/admin/admin-user-service';
import { CommonModule } from '@angular/common';

// Mat imports
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';


@Component({
  selector: 'app-admin-users',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule
  ],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers {
  showModal = false
  bookings: any[] = []
  filteredUsers: any[] = []
  userForm: any
  users: any
  rooms: any

  currentAdminId: number | null = null

  constructor(
    private userApi: AdminUserService,
    private builder: FormBuilder
  ){}

  ngOnInit(){
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    this.currentAdminId = user.id
    this.getUsers()
    this.userForm = this.builder.group({
      id: [''],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['000000000', Validators.required],
      password: ['ManualPassword123!', Validators.required],
      password_confirmation: ['ManualPassword123!', Validators.required],
      role: ['customer', Validators.required],
      last_name: ['Guest', Validators.required],
      first_name: ['User', Validators.required],
      country_name: ['Hungary', Validators.required],
      city_name: ['Budapest', Validators.required],
      address: ['Temporary Address', Validators.required],
      postal_code: ['0000', Validators.required],
      is_active: [1]
    })
  }


  // Crud start
  // read
  getUsers(){
    this.userApi.getUsers$().subscribe({
      next: (result: any) => {
        let allUsers = result.data.filter((u: any) => !u.deleted_at)
        this.users = allUsers.sort((a: any, b: any) => {
          const priority: any = { 'admin': 1, 'receptionist': 2, 'user': 3, 'guest': 3 }
          const pA = priority[a.role?.toLowerCase()] || 4
          const pB = priority[b.role?.toLowerCase()] || 4
          return pA - pB
      })

      this.filteredUsers = [...this.users];
      },
      error: (err: any) => {
        console.log(err)
      } 
    })
  }

  private flattenUserData(user: any) {
    return {
      ...user,
      first_name: user.first_name || user.profile?.first_name || 'Guest',
      last_name: user.last_name || user.profile?.last_name || 'User',

      country_name: user.country_name || user.profile?.address?.country_name || 'Hungary',
      city_name: user.city_name || user.profile?.address?.city_name || 'Budapest',
      postal_code: user.postal_code || user.profile?.address?.postal_code || '0000',
      address: user.address || user.profile?.address?.address || 'Default Address',

      email: user.email,
      phone: user.phone || user.profile?.phone || '000000000',
      password: 'ManualPassword123!',
      password_confirmation: 'ManualPassword123!'
    };
  }

toggleUserStatus(user: any) {
    const payload = this.flattenUserData(user)
    payload.is_active = user.is_active ? 0 : 1

    this.userApi.editUser$(user.id, payload).subscribe({
      next: () => {
        user.is_active = !user.is_active
        this.success(user.is_active ? "Activated" : "Deactivated")
      },
      error: (err: any) => {
        this.error("Validation error")
      }
    })
  }

  changeRole(user: any, newRole: string) {
    const payload = this.flattenUserData(user)
    payload.role = newRole

    this.userApi.editUser$(user.id, payload).subscribe({
      next: () => {
        user.role = newRole
        this.success("Role has been changed successfully")
      },
      error: (err: any) => {
        this.error("Validation error")
        this.getUsers()
      }
    });
  }

  addUser() {
    console.log("Form state:", this.userForm.status);
    
    if (this.userForm.valid) {
      const rawData = this.userForm.value;
      const nameParts = rawData.name ? rawData.name.trim().split(' ') : []
      
      const payload = {
        name: rawData.name,
        email: rawData.email,
        phone: rawData.phone || '000000000',
        password: rawData.password,
        password_confirmation: rawData.password,
        role: rawData.role,
        first_name: nameParts[0] || 'Guest',
        last_name: nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User',
        country_name: rawData.country_name || 'Hungary',
        city_name: rawData.city_name || 'Budapest',
        address: rawData.address || 'Default address',
        postal_code: rawData.postal_code || '0000',
        is_active: 1
      }

      this.userApi.addUser$(payload).subscribe({
        next: () => {
          this.success("User has been added!")
          this.getUsers()
          this.cancel()
        },
        error: (err: any) => {
          this.error("Backend error: " + JSON.stringify(err.error.data))
        }
      })
    } else {
      this.error("Form is invalid! Check your inputs.")
    }
  }

  // delete
  deleteUser(id: number){
    this.userApi.deleteUser$(id).subscribe({
      next: (result: any) => {
        console.log(result)
        this.getUsers()
        this.success("User has been deleted")
      },
      error: (error: any) => {
        console.log(error)
        this.error("Error deleting user")
      }
    })
  }
  
  confirmDelete(id: number){
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#bb5127",
      cancelButtonColor: "rgba(0, 0, 0, 1)",
      confirmButtonText: "Delete"
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteUser(id)
      }
    });
  }
  //Crud end
  
  //Alert
  success(text: string){ {
    Swal.fire({
      icon: 'success',
      title: text,
      showConfirmButton: false,
      timer: 1500
    })
    }
  }

  error(text: string){
    Swal.fire({
      position: "center",
      icon: "error",
      title: text,
      showConfirmButton: false,
      timer: 2500
    })
  }

  //Modal
  setShowModal(){
    this.showModal = true
  }

  cancel(){
    this.showModal = false
    this.userForm.reset()
  }

  //Search
  onSearch(event: any) {
    const term = event.target.value.toLowerCase()
    this.filteredUsers = this.users.filter((user: any) => 
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.id.toString().includes(term)
    )
  }

  onSort(event: any) {
    const key = event.target.value      
    if (!key) return

    this.filteredUsers.sort((a, b) => {
      let valA = a[key]
      let valB = b[key]

      if (typeof valA === 'string') {
        valA = valA.toLowerCase()
        valB = valB.toLowerCase()
      }

      if (valA < valB) return -1
      if (valA > valB) return 1
      return 0
    })
  }
}