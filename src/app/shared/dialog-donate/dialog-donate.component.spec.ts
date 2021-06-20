import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogDonateComponent } from './dialog-donate.component';

describe('DialogDonateComponent', () => {
  let component: DialogDonateComponent;
  let fixture: ComponentFixture<DialogDonateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogDonateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogDonateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
