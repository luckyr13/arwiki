import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityHistoryComponent } from './activity-history.component';

describe('ActivityHistoryComponent', () => {
  let component: ActivityHistoryComponent;
  let fixture: ComponentFixture<ActivityHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ActivityHistoryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
