import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyPagesComponent } from './my-pages.component';

describe('MyPagesComponent', () => {
  let component: MyPagesComponent;
  let fixture: ComponentFixture<MyPagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyPagesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyPagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
