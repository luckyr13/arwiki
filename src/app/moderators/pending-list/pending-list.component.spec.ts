import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingListComponent } from './pending-list.component';

describe('PendingListComponent', () => {
  let component: PendingListComponent;
  let fixture: ComponentFixture<PendingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PendingListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
