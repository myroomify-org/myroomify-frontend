import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminGuests } from './admin-guests';

describe('AdminGuests', () => {
  let component: AdminGuests;
  let fixture: ComponentFixture<AdminGuests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminGuests]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminGuests);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
