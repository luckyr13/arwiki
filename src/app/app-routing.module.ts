import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MainPageComponent } from './main-page/main-page.component';
import { PageComponent } from './page/page.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { AuthGuard } from './auth/auth.guard';
import { SearchComponent } from './search/search.component';

const routes: Routes = [
	{
		path: '',
		children: [
			{
				path: '', component: HomeComponent, pathMatch: 'full', 
				canActivate: [AuthGuard]
			},
			{
				path: ':lang', component: MainPageComponent, 
				canActivate: [AuthGuard]
			},
			{
				path: ':lang/search/:query', component: SearchComponent, 
				canActivate: [AuthGuard]
			},
			{
				path: ':lang/:slug', component: PageComponent, 
				canActivate: [AuthGuard]
			},
			{
				path: '**', component: PageNotFoundComponent, 
				canActivate: [AuthGuard]
			}
		]

	}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
