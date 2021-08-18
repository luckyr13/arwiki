import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from '../auth/auth.guard';
import { InitPlatformGuard } from '../auth/init-platform.guard';

const routes: Routes = [
	{
		path: ':lang/dashboard', component: DashboardComponent, 
		canActivate: [InitPlatformGuard, AuthGuard],
	}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserPanelRoutingModule { }
