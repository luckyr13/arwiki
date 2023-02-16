import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogVotedComponent } from './dialog-voted.component';

describe('DialogVotedComponent', () => {
  let component: DialogVotedComponent;
  let fixture: ComponentFixture<DialogVotedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogVotedComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogVotedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
