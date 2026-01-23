import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Mat imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdminAuthService } from '../shared/admin-auth-service';
import Swal from 'sweetalert2';

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
  registerForm!: FormGroup;
  hidePassword = true;

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private authApi: AdminAuthService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }


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
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const password_confirmation = form.get('password_confirmation')?.value;
    return password === password_confirmation ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.authApi.register$(this.registerForm.value).subscribe({
        next: (result: any) => {
          console.log('Registration successful!', result)
          this.router.navigate(['/login'])
          this.success()
        },
        error: (error: any) => {
          console.error('Error registering user', error)
          this.failed()
        }
      });
    }
  }

  success(){
    Swal.fire({
      position: "center",
      icon: "success",
      title: "Registration successful!",
      showConfirmButton: false,
      timer: 2500
    })
  }

  failed(){
    Swal.fire({
      position: "center",
      icon: "error",
      title: "Oops, something went wrong",
      showConfirmButton: false,
      timer: 2500
    });
  }
}