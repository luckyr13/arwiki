import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MainPageComponent } from './main-page/main-page.component';
import { SearchComponent } from './search/search.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './auth/auth.guard';
import { InitPlatformGuard } from './auth/init-platform.guard';
import { SearchEngineComponent } from './search-engine/search-engine.component';
import { ErrorComponent } from './error/error.component';

const routes: Routes = [
	{
		path: 'error',
		component: ErrorComponent
	},
	{
		path: '',
		canActivateChild: [InitPlatformGuard],
		children: [
			{
				path: '', component: HomeComponent, pathMatch: 'full',
			},
			{
				path: ':lang', redirectTo: ':lang/main', pathMatch: 'full',
			},
			{
				path: ':lang/main', component: MainPageComponent,
			},
			{
				path: ':lang/dashboard', component: DashboardComponent, 
				canActivate: [AuthGuard],
			},
			{
				path: ':lang/search/:query', component: SearchComponent,
			}
		]
	}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
