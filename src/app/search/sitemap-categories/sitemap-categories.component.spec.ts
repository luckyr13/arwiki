import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SitemapCategoriesComponent } from './sitemap-categories.component';

describe('SitemapCategoriesComponent', () => {
  let component: SitemapCategoriesComponent;
  let fixture: ComponentFixture<SitemapCategoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SitemapCategoriesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SitemapCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
