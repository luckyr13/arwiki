import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletedListComponent } from './deleted-list.component';

describe('DeletedListComponent', () => {
  let component: DeletedListComponent;
  let fixture: ComponentFixture<DeletedListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeletedListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeletedListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
