import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryUpdatesApprovedComponent } from './history-updates-approved.component';

describe('HistoryUpdatesApprovedComponent', () => {
  let component: HistoryUpdatesApprovedComponent;
  let fixture: ComponentFixture<HistoryUpdatesApprovedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HistoryUpdatesApprovedComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryUpdatesApprovedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
