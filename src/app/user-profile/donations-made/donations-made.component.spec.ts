import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonationsMadeComponent } from './donations-made.component';

describe('DonationsMadeComponent', () => {
  let component: DonationsMadeComponent;
  let fixture: ComponentFixture<DonationsMadeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DonationsMadeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DonationsMadeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
