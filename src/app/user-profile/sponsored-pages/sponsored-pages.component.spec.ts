import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SponsoredPagesComponent } from './sponsored-pages.component';

describe('SponsoredPagesComponent', () => {
  let component: SponsoredPagesComponent;
  let fixture: ComponentFixture<SponsoredPagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SponsoredPagesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SponsoredPagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
