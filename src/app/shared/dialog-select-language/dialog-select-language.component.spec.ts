import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogSelectLanguageComponent } from './dialog-select-language.component';

describe('DialogSelectLanguageComponent', () => {
  let component: DialogSelectLanguageComponent;
  let fixture: ComponentFixture<DialogSelectLanguageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogSelectLanguageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogSelectLanguageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
