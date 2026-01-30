import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../shared/auth/auth-service';

@Component({
  selector: 'app-email-verification',
  imports: [],
  templateUrl: './email-verification.html',
  styleUrl: './email-verification.css',
})
export class EmailVerification implements OnInit {
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authApi: AuthService
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    
    if (token) {
      this.authApi.verifyEmail$(token).subscribe({
        next: (result:any) => {
          Swal.fire('Siker!', 'E-mail megerősítve, most már beléphetsz.', 'success');
          this.router.navigate(['/login']);
        },
        error: (error:any) => {
          Swal.fire('Hiba', error.error.message || 'Érvénytelen token.', 'error');
          this.router.navigate(['/login']);
        }
      });
    }
  }
}
