import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestRoom } from './guest-room';

describe('GuestRoom', () => {
  let component: GuestRoom;
  let fixture: ComponentFixture<GuestRoom>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestRoom]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuestRoom);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
