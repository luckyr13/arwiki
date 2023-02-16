import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormBurnVaultComponent } from './form-burn-vault.component';

describe('FormBurnVaultComponent', () => {
  let component: FormBurnVaultComponent;
  let fixture: ComponentFixture<FormBurnVaultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormBurnVaultComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormBurnVaultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
