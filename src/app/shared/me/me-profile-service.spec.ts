import { TestBed } from '@angular/core/testing';

import { MeProfileService } from './me-profile-service';

describe('MeProfileService', () => {
  let service: MeProfileService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(MeProfileService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
