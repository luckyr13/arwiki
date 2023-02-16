import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormSetSettingsComponent } from './form-set-settings.component';

describe('FormSetSettingsComponent', () => {
  let component: FormSetSettingsComponent;
  let fixture: ComponentFixture<FormSetSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormSetSettingsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormSetSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
