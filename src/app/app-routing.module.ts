import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MainPageComponent } from './main-page/main-page.component';
import { PageComponent } from './page/page.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

const routes: Routes = [
	{
		path: '', component: HomeComponent, pathMatch: 'full'
	},
	{
		path: ':lang', component: MainPageComponent,
	},
	{
		path: ':lang/:slug', component: PageComponent,
	},
	{
		path: '**', component: PageNotFoundComponent
	}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
