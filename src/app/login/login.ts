import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Material & UI
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdminAuthService } from '../shared/admin-auth-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})

export class Login implements OnInit {
  loginForm!: FormGroup;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authApi: AdminAuthService
  ) {}

  ngOnInit(): void {
    if (this.authApi.getRole() !== 'guest') {
      const role = this.authApi.getRole();
      const target = role === 'customer' ? '/home' : '/admin/profile';
      this.router.navigate([target]);
    }

    this.loginForm = this.fb.group({
      login: ['', Validators.required],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.authApi.login$(this.loginForm.value).subscribe({
        next: (result: any) => {
          console.log('Login successful!', result);
          this.success();

          // Itt dől el az irány!
          const role = this.authApi.getRole();
          
          if (role === 'customer') {
            this.router.navigate(['/home']); 
          } else {
            this.router.navigate(['/admin/profile']); 
          }
        },
        error: (error: any) => {
          console.error('Login error', error);
          this.failed();
        }
      });
    }
  }

  success() {
    Swal.fire({
      icon: 'success',
      title: 'Welcome back!',
      showConfirmButton: false,
      timer: 1500
    });
  }

  failed() {
    Swal.fire({
      icon: 'error',
      title: 'Login failed',
      text: 'Invalid email or password.',
      confirmButtonColor: '#2d4037'
    });
  }
}