import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormMintComponent } from './form-mint.component';

describe('FormMintComponent', () => {
  let component: FormMintComponent;
  let fixture: ComponentFixture<FormMintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormMintComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormMintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
