import { TestBed } from '@angular/core/testing';

import { PublicRoomService } from './public-room-service';

describe('PublicRoomService', () => {
  let service: PublicRoomService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(PublicRoomService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
