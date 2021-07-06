import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageUpdatesComponent } from './page-updates.component';

describe('PageUpdatesComponent', () => {
  let component: PageUpdatesComponent;
  let fixture: ComponentFixture<PageUpdatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PageUpdatesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PageUpdatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
