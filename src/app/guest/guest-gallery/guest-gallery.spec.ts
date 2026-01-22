import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestGallery } from './guest-gallery';

describe('GuestGallery', () => {
  let component: GuestGallery;
  let fixture: ComponentFixture<GuestGallery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestGallery]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuestGallery);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
