import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule} from "@angular/router";
import { filter } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../shared/auth/auth-service';

// Mat imports
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-guest-navbar',
  imports: [
    RouterModule,
    CommonModule,
    CommonModule, 
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './guest-navbar.html',
  styleUrl: './guest-navbar.css',
})
export class GuestNavbar {
  isMenuCollapsed: boolean = true

  isSpecialPage: boolean = true
  public authApi = inject(AuthService)

  constructor(
    public translate: TranslateService,
    private router: Router
  ) {
    const savedLang = localStorage.getItem('lang') || 'hu'
    this.translate.use(savedLang)

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const specialRoutes = ['/', '/home', '/register', '/login']
      this.isSpecialPage = specialRoutes.includes(event.urlAfterRedirects)
      this.isMenuCollapsed = true
    })
  }

  changeLang(lang: string) {
    this.translate.use(lang)
    localStorage.setItem('lang', lang)
  }

  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed
  }

  profile(): void {
    this.router.navigate(['/profile'])
  }

  logout(): void {
    this.authApi.logout$();
    this.router.navigate(['/login'])
    console.log('Logout successful!')
  }
}
