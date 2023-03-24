import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';

import { SearchRoutingModule } from './search-routing.module';
import { ResultsComponent } from './results/results.component';
import { SitemapComponent } from './sitemap/sitemap.component';
import { SitemapCategoriesComponent } from './sitemap-categories/sitemap-categories.component';
import { SitemapPagesComponent } from './sitemap-pages/sitemap-pages.component';
import { SitemapLangsComponent } from './sitemap-langs/sitemap-langs.component';


@NgModule({
  declarations: [
    ResultsComponent,
    SitemapComponent,
    SitemapCategoriesComponent,
    SitemapPagesComponent,
    SitemapLangsComponent
  ],
  imports: [
    CommonModule,
    SearchRoutingModule,
    SharedModule
  ]
})
export class SearchModule { }
