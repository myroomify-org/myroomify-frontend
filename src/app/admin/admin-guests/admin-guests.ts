import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-guests',
  imports: [CommonModule],
  template: `
    <div class="guest-list-minimal">
      <div class="d-flex align-items-center mb-3 text-dark opacity-75">
        <i class="bi bi-people me-2"></i>
        <span class="small fw-bold text-uppercase tracking-wider">Vendégadatok</span>
      </div>

      <div class="row g-3" *ngIf="guests && guests.length > 0; else emptyState">
        <div *ngFor="let guest of guests" class="col-md-6 col-lg-4">
          <div class="guest-card">
            <div class="fw-bold">{{ guest.name }}</div>
            <div class="text-muted small">{{ guest.id_card_number }}</div>
          </div>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="text-muted small py-2 italic">
          Nincs rögzített vendégadat ehhez a foglaláshoz.
        </div>
      </ng-template>
    </div>
  `,
  styleUrl: './admin-guests.css',
})
export class AdminGuests {
  @Input() guests: any[] = []
}
