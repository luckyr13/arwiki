import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogEditLanguageComponent } from './dialog-edit-language.component';

describe('DialogEditLanguageComponent', () => {
  let component: DialogEditLanguageComponent;
  let fixture: ComponentFixture<DialogEditLanguageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogEditLanguageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogEditLanguageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
