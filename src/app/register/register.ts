import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../shared/auth/auth-service';
import Swal from 'sweetalert2';

// Mat imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-register',
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
  templateUrl: './register.html',
  styleUrl: './register.css'
})

export class Register implements OnInit {

  // Variables
  registerForm!: FormGroup
  hidePassword = true

  // Constructor
  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private authApi: AuthService
  ) {}

  ngOnInit(): void {
    this.initForm()
  }

  // Register form
  private initForm(): void {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', Validators.required],

      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      phone: ['', Validators.required],

      country_name: ['', Validators.required],
      city_name: ['', Validators.required],
      postal_code: ['', Validators.required],
      address: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator 
    })
  }

  // Password validator
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value
    const password_confirmation = form.get('password_confirmation')?.value
    return password === password_confirmation ? null : { mismatch: true }
  }

  // Registration submit
  onSubmit(): void {
    if (this.registerForm.valid) {
      this.authApi.register$(this.registerForm.value).subscribe({
        next: (result: any) => {
          console.log('Registration successful!', result)
          this.router.navigate(['/login'])
          this.success('Registration successful!')
        },
        error: (error: any) => {
          console.error('Error registering user', error)
          this.failed('Registration failed!')
        }
      });
    }
  }

  // Alerts
  success(text: string){
    Swal.fire({
      position: "center",
      icon: "success",
      title: text,
      showConfirmButton: false,
      timer: 2500
    })
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