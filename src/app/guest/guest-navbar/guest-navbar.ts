import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule} from "@angular/router";
import { filter } from 'rxjs';

// Mat imports
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdminAuthService } from '../../shared/admin-auth-service';

@Component({
  selector: 'app-guest-navbar',
  imports: [
    RouterModule,
    CommonModule,
    CommonModule, 
    MatMenuModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './guest-navbar.html',
  styleUrl: './guest-navbar.css',
})
export class GuestNavbar {
  isSpecialPage: boolean = true
  public authApi = inject(AdminAuthService)

  constructor(
    private router: Router,
    private aiuthApi: AdminAuthService    
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const specialRoutes = ['/', '/home', '/register', '/login']
      this.isSpecialPage = specialRoutes.includes(event.urlAfterRedirects)
    });
  }

  logout(): void {
    this.authApi.logout$();
    this.router.navigate(['/login'])
    console.log('Logout successful!')
  }
}
