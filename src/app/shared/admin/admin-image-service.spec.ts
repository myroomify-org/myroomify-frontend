import { TestBed } from '@angular/core/testing';

import { AdminImageService } from './admin-image-service';

describe('AdminImageService', () => {
  let service: AdminImageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminImageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
