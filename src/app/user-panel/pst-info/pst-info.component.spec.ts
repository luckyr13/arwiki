import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PstInfoComponent } from './pst-info.component';

describe('PstInfoComponent', () => {
  let component: PstInfoComponent;
  let fixture: ComponentFixture<PstInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PstInfoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PstInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
