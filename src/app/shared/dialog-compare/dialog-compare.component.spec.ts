import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogCompareComponent } from './dialog-compare.component';

describe('DialogCompareComponent', () => {
  let component: DialogCompareComponent;
  let fixture: ComponentFixture<DialogCompareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogCompareComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogCompareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
