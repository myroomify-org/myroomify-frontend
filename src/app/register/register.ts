import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../shared/auth/auth-service';
import Swal from 'sweetalert2';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';



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
    MatIconModule,
    MatCheckboxModule,
    TranslateModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})

export class Register implements OnInit {
  registerForm!: FormGroup
  hidePassword = true
  loading = false

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private authApi: AuthService,
    private translate: TranslateService
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
      address: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue]
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
      this.loading = true
      this.authApi.register$(this.registerForm.value).subscribe({
        next: (response: any) => {
          this.loading = false
          console.log(response)
          this.router.navigate(['/login'])
          this.success(response.message || this.translate.instant('REGISTER.ALERTS.TITLE_SUCCESS'))          
        },
        error: (error: any) => {
          this.loading = false
          const errorMessage = error.error?.message || this.translate.instant('REGISTER.ALERTS.FAILED')
          this.failed(errorMessage)          
        }
      })
    }
  }

  // Alerts
  success(title: string){
    Swal.fire({
      position: "center",
      icon: "success",
      iconColor: "#c3ae80",
      title: title,
      showConfirmButton: false,
      timer: 2500
    })
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