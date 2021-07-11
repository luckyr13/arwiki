import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogConfirmAmountComponent } from './dialog-confirm-amount.component';

describe('DialogConfirmAmountComponent', () => {
  let component: DialogConfirmAmountComponent;
  let fixture: ComponentFixture<DialogConfirmAmountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogConfirmAmountComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogConfirmAmountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
