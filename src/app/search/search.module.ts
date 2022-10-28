import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';

import { SearchRoutingModule } from './search-routing.module';
import { ResultsComponent } from './results/results.component';
import { SitemapComponent } from './sitemap/sitemap.component';


@NgModule({
  declarations: [
    ResultsComponent,
    SitemapComponent
  ],
  imports: [
    CommonModule,
    SearchRoutingModule,
    SharedModule
  ]
})
export class SearchModule { }
