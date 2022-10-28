import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ResultsComponent } from './results/results.component';
import { SitemapComponent } from './sitemap/sitemap.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'sitemap', component: SitemapComponent,
      },
      {
        path: ':query', component: ResultsComponent,
      },
      {
        path: '', redirectTo: 'sitemap', pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SearchRoutingModule { }
