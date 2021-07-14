import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomSheetShareComponent } from './bottom-sheet-share.component';

describe('BottomSheetShareComponent', () => {
  let component: BottomSheetShareComponent;
  let fixture: ComponentFixture<BottomSheetShareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BottomSheetShareComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BottomSheetShareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
