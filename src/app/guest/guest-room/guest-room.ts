import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AdminRoomsService } from '../../shared/admin-rooms-service';

// mat imports
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-guest-room',
  imports: [
    CommonModule,
    RouterModule,
    MatDatepickerModule,
    MatMenuModule,
    MatButtonModule,
    MatNativeDateModule,
  ],
  templateUrl: './guest-room.html',
  styleUrl: './guest-room.css',
})
export class GuestRoom implements OnInit{

  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;

  room: any = null
  loading: boolean = true

  startDate: Date | null = null
  endDate: Date | null = null
  selectedRange: string = ''
  today: Date = new Date();

  isChoosingCheckout: boolean = false

  constructor(
    private route: ActivatedRoute,
    private apiRooms: AdminRoomsService
  ) {}

  ngOnInit(): void {
    const roomId = Number(this.route.snapshot.paramMap.get('id'))
    if (roomId) {
      this.getRoom(roomId)
    }
  }

  getRoom(id: number): void {
    this.apiRooms.getRoom$(id).subscribe({
      next: (result: any) => {
        console.log(result)
        this.room = result?.data || result
        this.loading = false
      },
      error: (err) => {
        console.error('Error loading room details', err)
        this.loading = false
      }
    });
  }

  onDateSelected(date: Date | null) {
    if (!date) return;

    if (!this.isChoosingCheckout) {
      this.startDate = date;
      if (this.endDate && this.startDate > this.endDate) {
        this.endDate = null;
      }
    } else {
      if (this.startDate && date < this.startDate) {
        this.startDate = date;
        this.endDate = null;
      } else {
        this.endDate = date;
      }
    }
    setTimeout(() => {
      if (this.menuTrigger) {
        this.menuTrigger.closeMenu();
      }
    }, 150);
  }

  openCalendar(forCheckout: boolean) {
    this.isChoosingCheckout = forCheckout;
  }

  calculateTotalPrice(): number {
    if (this.startDate && this.endDate && this.room) {
      const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays * this.room.price;
    }
    return 0;
  }
}
