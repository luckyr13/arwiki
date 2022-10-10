import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublishedPagesComponent } from './published-pages.component';

describe('PublishedPagesComponent', () => {
  let component: PublishedPagesComponent;
  let fixture: ComponentFixture<PublishedPagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PublishedPagesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublishedPagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
