import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovedListComponent } from './approved-list.component';

describe('ApprovedListComponent', () => {
  let component: ApprovedListComponent;
  let fixture: ComponentFixture<ApprovedListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApprovedListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApprovedListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
