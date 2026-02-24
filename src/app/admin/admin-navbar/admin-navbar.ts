import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/auth/auth-service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';


// Mat imports
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-navbar',
  imports: [
    CommonModule,
    RouterModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './admin-navbar.html',
  styleUrl: './admin-navbar.css',
})
export class AdminNavbar {
  isMenuOpen = false
  
  constructor(
    public authApi: AuthService,
    private router: Router,
    public translate: TranslateService
  ) {
    const savedLang = localStorage.getItem('lang') || 'hu'
    this.translate.use(savedLang)
  }

  changeLang(lang: string) {
    this.translate.use(lang)
    localStorage.setItem('lang', lang)
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authApi.logout$()
  }

  profile() {
    this.router.navigate(['/admin/profile'])
  }
}
