import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogStampComponent } from './dialog-stamp.component';

describe('DialogStampComponent', () => {
  let component: DialogStampComponent;
  let fixture: ComponentFixture<DialogStampComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogStampComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogStampComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
