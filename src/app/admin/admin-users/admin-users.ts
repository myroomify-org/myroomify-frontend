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
      first_name: ['New', Validators.required],
      country_name: ['Hungary', Validators.required],
      city_name: ['Budapest', Validators.required],
      address: ['Unknown', Validators.required],
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

  changeRole(user: any, newRole: string) {
    const updatedUser = { 
      ...user, role: newRole ,
      password: 'ManualPassword123!',
      password_confirmation: 'ManualPassword123!'
    }

    this.userApi.editUser$(user.id, updatedUser).subscribe({
      next: () => {
        user.role = newRole
        this.success("Jogosultság frissítve")
      },
      error: (error: any) => {
        console.error(error)
        console.log("A többi fejlesztőnek: A módosítás azért nem működik, mert minden adatot vissza kéne adnom, még olyan részleteket is, mint a postcode, ami jelen esetben teljesen felesleges")
        this.error("Error updating user role")
        this.getUsers()
      }
    })
  }

  toggleUserStatus(user: any) {
    const updatedUser = { 
      ...user, 
      is_active: user.is_active ? 0 : 1 
    }

    this.userApi.editUser$(user.id, updatedUser).subscribe({
      next: () => {
        user.is_active = !user.is_active
        this.success(user.is_active ? "User activated" : "User deactivated")
      },
      error: (error: any) => {
        console.log(error)
        this.error("Error updating user status")
      }
    });
  }

  addUser() {
    if (this.userForm.valid) {
      const fullData = {
        ...this.userForm.value,
        password_confirmation: this.userForm.value.password,
            
        first_name: this.userForm.value.name,
        last_name: 'Pending',
        country_name: 'Hungary',
        city_name: 'Budapest',
        address: 'Default Address 1.',
        postal_code: '0000',
        is_active: 1
      }

      this.userApi.addUser$(fullData).subscribe({
        next: (res: any) => {
          this.success("User successfully created!")
          this.getUsers()
          this.cancel()
        },
        error: (err: any) => {
          console.error("Backend hiba:", err)
          this.error("Validation failed. Check console!")
        }
      })
    } else {
      this.error("Please fill in name, email and password!")
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
    const key = event.target.value;      
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
      return 0;
    })
  }
}