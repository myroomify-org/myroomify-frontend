import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestNavbar } from './guest-navbar';

describe('GuestNavbar', () => {
  let component: GuestNavbar;
  let fixture: ComponentFixture<GuestNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestNavbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuestNavbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
