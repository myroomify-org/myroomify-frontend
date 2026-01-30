import { TestBed } from '@angular/core/testing';

import { AdminRoomsService } from './admin-rooms-service';

describe('AdminRoomsService', () => {
  let service: AdminRoomsService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(AdminRoomsService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
