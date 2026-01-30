import { TestBed } from '@angular/core/testing';

import { MeBookingService } from './me-booking-service';

describe('MeBookingService', () => {
  let service: MeBookingService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(MeBookingService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
