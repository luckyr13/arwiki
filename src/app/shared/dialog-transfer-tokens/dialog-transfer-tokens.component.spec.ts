import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogTransferTokensComponent } from './dialog-transfer-tokens.component';

describe('DialogTransferTokensComponent', () => {
  let component: DialogTransferTokensComponent;
  let fixture: ComponentFixture<DialogTransferTokensComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogTransferTokensComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogTransferTokensComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
