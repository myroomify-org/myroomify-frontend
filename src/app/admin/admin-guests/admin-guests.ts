import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-guests',
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="guest-list-minimal p-3">
      <div class="d-flex align-items-center mb-3 text-dark opacity-75">
        <i class="bi bi-people-fill me-2 text-gold"></i>
        <span class="small fw-bold text-uppercase tracking-wider">{{ 'ADMIN_BOOKINGS.GUEST_MODAL.REGISTERED_GUESTS' | translate }}</span>
      </div>

      <div class="row g-2" *ngIf="guests && guests.length > 0; else emptyState">
        <div *ngFor="let guest of guests" class="col-md-6 col-lg-4">
          <div class="guest-display-card">
            <div class="d-flex align-items-center">
              <div class="guest-avatar me-2">
                {{ guest.first_name?.[0] }}{{ guest.last_name?.[0] }}
              </div>
              <div class="overflow-hidden">
                <div class="fw-bold text-dark text-truncate">
                  {{ guest.last_name }} {{ guest.first_name }}
                </div>
                <div class="text-muted small">
                  <i class="bi bi-card-text me-1"></i>{{ guest.document_number }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="alert alert-light border-0 small py-2 font-italic">
          <i class="bi bi-info-circle me-2"></i>{{ 'ADMIN_BOOKINGS.GUEST_MODAL.NO_GUESTS' | translate }}
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .guest-display-card {
      background: #ffffff;
      border: 1px solid #eee;
      border-radius: 8px;
      padding: 10px;
      transition: all 0.2s;
    }
    .guest-avatar {
      width: 35px;
      height: 35px;
      background: #2d4037;
      color: #c3ae80;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: bold;
      flex-shrink: 0;
    }
    .text-gold { color: #c3ae80; }
  `],
  styleUrl: './admin-guests.css',
})
export class AdminGuests {
  @Input() guests: any[] = []
}
