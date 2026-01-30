import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../shared/auth/auth-service';

// Mat imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})

export class Login implements OnInit {
  
  // Variables
  loginForm!: FormGroup;
  hidePassword = true;

  // Constructor
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authApi: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authApi.getRole() !== 'guest') {
      const role = this.authApi.getRole()
      const target = role === 'customer' ? '/home' : '/admin/profile'
      this.router.navigate([target])
    }

    this.loginForm = this.fb.group({
      login: ['', Validators.required],
      password: ['', [Validators.required]]
    });
  }

  // Login
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.authApi.login$(this.loginForm.value).subscribe({
        next: (result: any) => {
          console.log('Login successful!', result)
          this.success("Login successful!")

          const role = this.authApi.getRole()
          
          if (role === 'customer') {
            this.router.navigate(['/home'])
          } else {
            this.router.navigate(['/admin/profile'])
          }
        },
        error: (error: any) => {
          console.error('Login error', error)
          if (error.status === 403 && error.error?.message === "Email not verified") {
            this.verificationRequired()
          } else {
            this.failed("Login failed!")
          }
        }
      })
    }
  }

  // Alerts
  verificationRequired() {
    Swal.fire({
      icon: 'warning',
      title: 'Email verification needed',
      text: 'Please check your inbox and confirm your email address before logging in.',
      confirmButtonColor: '#2d4037',
      confirmButtonText: 'I understand'
    })
  }

  success(text: string) {
    Swal.fire({
      icon: 'success',
      title: text,
      showConfirmButton: false,
      timer: 1500
    })
  }

  failed(text: string) {
    Swal.fire({
      icon: 'error',
      title: text,
      text: 'Invalid email or password.',
      confirmButtonColor: '#2d4037'
    })
  }
}