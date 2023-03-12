import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogNewLanguageComponent } from './dialog-new-language.component';

describe('DialogNewLanguageComponent', () => {
  let component: DialogNewLanguageComponent;
  let fixture: ComponentFixture<DialogNewLanguageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogNewLanguageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogNewLanguageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
