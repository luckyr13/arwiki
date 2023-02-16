import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogNewVoteComponent } from './dialog-new-vote.component';

describe('DialogNewVoteComponent', () => {
  let component: DialogNewVoteComponent;
  let fixture: ComponentFixture<DialogNewVoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogNewVoteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogNewVoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
