import { TestBed } from '@angular/core/testing';

import { AdminGuestService } from './admin-guest-service';

describe('AdminGuestService', () => {
  let service: AdminGuestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminGuestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
