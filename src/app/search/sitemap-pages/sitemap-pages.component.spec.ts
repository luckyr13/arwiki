import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SitemapPagesComponent } from './sitemap-pages.component';

describe('SitemapPagesComponent', () => {
  let component: SitemapPagesComponent;
  let fixture: ComponentFixture<SitemapPagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SitemapPagesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SitemapPagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
