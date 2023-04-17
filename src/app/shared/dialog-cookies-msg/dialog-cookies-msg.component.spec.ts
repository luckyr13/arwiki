import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogCookiesMsgComponent } from './dialog-cookies-msg.component';

describe('DialogCookiesMsgComponent', () => {
  let component: DialogCookiesMsgComponent;
  let fixture: ComponentFixture<DialogCookiesMsgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogCookiesMsgComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogCookiesMsgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
