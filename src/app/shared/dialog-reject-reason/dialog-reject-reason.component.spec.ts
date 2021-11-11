import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogRejectReasonComponent } from './dialog-reject-reason.component';

describe('DialogRejectReasonComponent', () => {
  let component: DialogRejectReasonComponent;
  let fixture: ComponentFixture<DialogRejectReasonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogRejectReasonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogRejectReasonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
