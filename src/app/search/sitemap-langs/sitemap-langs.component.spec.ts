import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SitemapLangsComponent } from './sitemap-langs.component';

describe('SitemapLangsComponent', () => {
  let component: SitemapLangsComponent;
  let fixture: ComponentFixture<SitemapLangsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SitemapLangsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SitemapLangsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
