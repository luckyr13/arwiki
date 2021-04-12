import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAdminListComponent } from './view-admin-list.component';

describe('ViewAdminListComponent', () => {
  let component: ViewAdminListComponent;
  let fixture: ComponentFixture<ViewAdminListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewAdminListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewAdminListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
