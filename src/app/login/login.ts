import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../shared/auth/auth-service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';

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
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})

export class Login implements OnInit {
 
  loginForm!: FormGroup;
  hidePassword = true;
  loading: boolean = false

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
      this.loading = true
      this.authApi.login$(this.loginForm.value).subscribe({
        next: (response:any) => {
          this.success(response.message || this.translate.instant('LOGIN.ALERTS.TITLE_SUCCESS'))
          const role = this.authApi.getRole()
          this.loading = false
          
          if (role === 'customer') {
            const pendingRoomId = localStorage.getItem('pending_booking_room_id');
  
            if (pendingRoomId) {
              const start = localStorage.getItem('pending_start');
              const end = localStorage.getItem('pending_end');
              const guests = localStorage.getItem('pending_guests');

              localStorage.removeItem('pending_booking_room_id');
              localStorage.removeItem('pending_start');
              localStorage.removeItem('pending_end');
              localStorage.removeItem('pending_guests');

              this.router.navigate(['/rooms/' + pendingRoomId], {
                queryParams: { start, end, guests }
              });
            } else {
              this.router.navigate(['/home']);
            }
          } else {
            this.router.navigate(['/admin/profile'])
          }
        },
        error: (error: any) => {
          this.loading = false
          if (error.status === 403 && error.error?.message === "Email not verified") {
            this.verificationRequired()
          } else {
            this.failed(error.error?.message)
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

  failed(text: string) {
    Swal.fire({
      icon: 'error',
      title: this.translate.instant('LOGIN.ALERTS.TITLE_FAILED'),
      text: text,
      confirmButtonColor: '#2d4037'
    })
  }
}