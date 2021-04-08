import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MainPageComponent } from './main-page/main-page.component';
import { PageComponent } from './page/page.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { SearchComponent } from './search/search.component';
import { EditPageComponent } from './edit-page/edit-page.component';
import { CreatePageComponent } from './create-page/create-page.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CategoryComponent } from './category/category.component';
import { AuthGuard } from './auth/auth.guard';
import { InitPlatformGuard } from './auth/init-platform.guard';

const routes: Routes = [
	{
		path: '',
		canActivateChild: [InitPlatformGuard],
		children: [
			{
				path: '', component: HomeComponent, pathMatch: 'full',
			},
			{
				path: ':lang', redirectTo: ':lang/home', pathMatch: 'full',
			},
			{
				path: ':lang/home', component: MainPageComponent,
			},
			{
				path: ':lang/dashboard', component: DashboardComponent, 
				canActivate: [AuthGuard],
			},
			{
				path: ':lang/create-page', component: CreatePageComponent, 
				canActivate: [AuthGuard],
			},
			{
				path: ':lang/search/:query', component: SearchComponent,
			},
			{
				path: ':lang/category/:category', component: CategoryComponent,
			},
			{
				path: ':lang/:slug', component: PageComponent
			},
			{
				path: ':lang/:slug/edit', component: EditPageComponent, 
				canActivate: [AuthGuard],
			},
			
			{
				path: '**', component: PageNotFoundComponent,
			}
		]

	}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
