import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogVotePageComponent } from './dialog-vote-page.component';

describe('DialogVotePageComponent', () => {
  let component: DialogVotePageComponent;
  let fixture: ComponentFixture<DialogVotePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogVotePageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogVotePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
