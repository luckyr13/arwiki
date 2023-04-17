import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogEditPagePropertiesComponent } from './dialog-edit-page-properties.component';

describe('DialogEditPagePropertiesComponent', () => {
  let component: DialogEditPagePropertiesComponent;
  let fixture: ComponentFixture<DialogEditPagePropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogEditPagePropertiesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogEditPagePropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
