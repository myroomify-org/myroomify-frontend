import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { AdminGuestService } from '../../shared/admin/admin-guest-service';

@Component({
  selector: 'app-admin-guests',
  imports: [],
  templateUrl: './admin-guests.html',
  styleUrl: './admin-guests.css',
})
export class AdminGuests {
  showModal = false
  guests: any[] = []
  filteredGuests: any[] = []
  guestForm: any

  constructor(
    private guestApi: AdminGuestService,
    private builder: FormBuilder
  ){}

  ngOnInit(){
    this.guestForm = this.builder.group({
      id: [''],
      name: [''],
      email: [''],
      role: [''],
    })
  }
}
