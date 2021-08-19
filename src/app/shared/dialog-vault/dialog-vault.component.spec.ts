import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogVaultComponent } from './dialog-vault.component';

describe('DialogVaultComponent', () => {
  let component: DialogVaultComponent;
  let fixture: ComponentFixture<DialogVaultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogVaultComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogVaultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
