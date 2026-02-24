import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../shared/auth/auth-service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Mat imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';


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
    MatIconModule,
    TranslateModule
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
    private authApi: AuthService,
    private http: HttpClient,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({  
        login: ['', Validators.required],
        password: ['', [Validators.required]]
      })
  }

  // Login
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.authApi.login$(this.loginForm.value).subscribe({
        next: () => {
          this.success((this.translate.instant('LOGIN.ALERTS.SUCCESS')))
          const role = this.authApi.getRole()
          
          if (role === 'customer') {
            this.router.navigate(['/home'])
          } else {
            this.router.navigate(['/admin/profile'])
          }
        },
        error: (error: any) => {
          if (error.status === 403 && error.error?.message === "Email not verified") {
            this.verificationRequired()
          } else {
            this.failed(this.translate.instant('LOGIN.ALERTS.TITLE_FAILED'))
          }
        }
      })
    }
  }

  // Alerts
  verificationRequired() {
    Swal.fire({
      icon: 'warning',
      iconColor: '#c3ae80',
      title: this.translate.instant('LOGIN.ALERTS.VERIFICATION_TITLE'),
      text: this.translate.instant('LOGIN.ALERTS.VERIFICATION_TEXT'),
      confirmButtonColor: '#2d4037',
      confirmButtonText: 'I understand'
    })
  }

  success(title: string) {
    Swal.fire({
      icon: 'success',
      iconColor: '#c3ae80',
      title: title,
      showConfirmButton: false,
      timer: 1500
    })
  }

  failed(title: string) {
    Swal.fire({
      icon: 'error',
      title: title,
      text: this.translate.instant('LOGIN.ALERTS.TEXT_FAILED'),
      confirmButtonColor: '#2d4037'
    })
  }
}