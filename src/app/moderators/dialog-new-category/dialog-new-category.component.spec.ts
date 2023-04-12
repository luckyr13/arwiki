import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogNewCategoryComponent } from './dialog-new-category.component';

describe('DialogNewCategoryComponent', () => {
  let component: DialogNewCategoryComponent;
  let fixture: ComponentFixture<DialogNewCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogNewCategoryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogNewCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
