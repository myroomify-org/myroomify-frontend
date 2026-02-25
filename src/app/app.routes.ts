import { Routes } from '@angular/router';
import { AdminNavbar } from './admin/admin-navbar/admin-navbar';
import { AdminRooms } from './admin/admin-rooms/admin-rooms';
import { AdminBookings } from './admin/admin-bookings/admin-bookings';
import { AdminRoom } from './admin/admin-room/admin-room';
import { AdminUsers } from './admin/admin-users/admin-users';
import { GuestHomePage } from './guest/guest-home-page/guest-home-page';
import { AdminGuests } from './admin/admin-guests/admin-guests';
import { GuestNavbar } from './guest/guest-navbar/guest-navbar';
import { GuestRooms } from './guest/guest-rooms/guest-rooms';
import { GuestGallery } from './guest/guest-gallery/guest-gallery';
import { Login } from './login/login';
import { Register } from './register/register';
import { GuestRoom } from './guest/guest-room/guest-room';
import { GuestProfile } from './guest/guest-profile/guest-profile';
import { AdminProfile } from './admin/admin-profile/admin-profile';
import { roleGuard } from './shared/auth/role-guard';
import { PrivacyPolicy } from './privacy-policy/privacy-policy';

export const routes: Routes = [
    { path: '', component: GuestNavbar,
        children: [
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: 'home', component: GuestHomePage },
            { path: 'rooms', component: GuestRooms },
            { path: 'rooms/:id', component: GuestRoom },
            { path: 'gallery', component: GuestGallery },
            { path: 'profile', component: GuestProfile },
            { path: 'login', component: Login },
            { path: 'register', component: Register },
            { path: 'privacy-policy', component: PrivacyPolicy },
        ]
    },
    { path: 'admin', component: AdminNavbar,
        children: [
            { path: '', redirectTo: 'bookings', pathMatch: 'full' },
            { 
              path: 'rooms', 
              component: AdminRooms, 
              canActivate: [roleGuard], 
              data: { roles: ['admin', 'superadmin'] } 
            },
            { 
              path: 'rooms/:id',
              component: AdminRoom, 
              canActivate: [roleGuard], 
              data: { roles: ['admin', 'superadmin'] } 
            },                      
            { 
              path: 'users', 
              component: AdminUsers, 
              canActivate: [roleGuard], 
              data: { roles: ['admin', 'superadmin'] } 
            },
            { path: 'bookings', component: AdminBookings },  
            { path: 'guests', component: AdminGuests },
            { path: 'profile', component: AdminProfile }, 
         ]
    },     
];