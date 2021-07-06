import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyUpdatesComponent } from './my-updates.component';

describe('MyUpdatesComponent', () => {
  let component: MyUpdatesComponent;
  let fixture: ComponentFixture<MyUpdatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyUpdatesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyUpdatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
