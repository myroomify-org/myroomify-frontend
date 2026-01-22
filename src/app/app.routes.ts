import { Routes } from '@angular/router';
import { AdminLogin } from './admin/admin-login/admin-login';
import { AdminNavbar } from './admin/admin-navbar/admin-navbar';
import { AdminRooms } from './admin/admin-rooms/admin-rooms';
import { AdminBookings } from './admin/admin-bookings/admin-bookings';
import { AdminAccount } from './admin/admin-account/admin-account';
import { AdminRoom } from './admin/admin-room/admin-room';
import { AdminCalendar } from './admin/admin-calendar/admin-calendar';
import { AdminUsers } from './admin/admin-users/admin-users';
import { GuestHomePage } from './guest/guest-home-page/guest-home-page';
import { AdminGuests } from './admin/admin-guests/admin-guests';
import { GuestNavbar } from './guest/guest-navbar/guest-navbar';
import { GuestRooms } from './guest/guest-rooms/guest-rooms';
import { GuestGallery } from './guest/guest-gallery/guest-gallery';
import { Login } from './login/login';
import { Register } from './register/register';

export const routes: Routes = [
    { path: '', component: GuestNavbar,
        children: [
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: 'home', component: GuestHomePage },
            { path: 'rooms', component: GuestRooms },
            { path: 'gallery', component: GuestGallery },
            { path: 'login', component: Login },
            { path: 'register', component: Register },
        ]
    },
    { path: 'home', component: GuestHomePage },
    // { path: 'login', component: AdminLogin },
    { path: 'navbar', component: AdminNavbar,
        children: [
            { path: '', redirectTo: 'calendar', pathMatch: 'full' },
            { path: 'calendar', component: AdminCalendar },
            { path: 'rooms', component: AdminRooms },
            { path: 'room/:id', component: AdminRoom },
            { path: 'bookings', component: AdminBookings },            
            { path: 'users', component: AdminUsers },
            { path: 'guests', component: AdminGuests },
            { path: 'account', component: AdminAccount }, 
         ]
    },     
];