import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormIndicativeComponent } from './form-indicative.component';

describe('FormIndicativeComponent', () => {
  let component: FormIndicativeComponent;
  let fixture: ComponentFixture<FormIndicativeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormIndicativeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormIndicativeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
