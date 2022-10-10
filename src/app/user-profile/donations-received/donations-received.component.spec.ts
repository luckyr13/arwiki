import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonationsReceivedComponent } from './donations-received.component';

describe('DonationsReceivedComponent', () => {
  let component: DonationsReceivedComponent;
  let fixture: ComponentFixture<DonationsReceivedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DonationsReceivedComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DonationsReceivedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
