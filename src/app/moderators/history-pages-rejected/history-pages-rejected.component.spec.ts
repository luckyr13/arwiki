import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryPagesRejectedComponent } from './history-pages-rejected.component';

describe('HistoryPagesRejectedComponent', () => {
  let component: HistoryPagesRejectedComponent;
  let fixture: ComponentFixture<HistoryPagesRejectedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HistoryPagesRejectedComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryPagesRejectedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
