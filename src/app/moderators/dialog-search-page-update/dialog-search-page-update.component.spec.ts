import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogSearchPageUpdateComponent } from './dialog-search-page-update.component';

describe('DialogSearchPageUpdateComponent', () => {
  let component: DialogSearchPageUpdateComponent;
  let fixture: ComponentFixture<DialogSearchPageUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogSearchPageUpdateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogSearchPageUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
