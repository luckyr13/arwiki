import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomSheetLoginComponent } from './bottom-sheet-login.component';

describe('BottomSheetLoginComponent', () => {
  let component: BottomSheetLoginComponent;
  let fixture: ComponentFixture<BottomSheetLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BottomSheetLoginComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BottomSheetLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
