import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../auth/auth.guard';
import { ModeratorGuard } from '../auth/moderator.guard';
import { InitPlatformGuard } from '../auth/init-platform.guard';
import { PendingListComponent } from './pending-list/pending-list.component';

const routes: Routes = [
	{
		path: ':lang/moderators',
		canActivateChild: [InitPlatformGuard, AuthGuard, ModeratorGuard],
		children: [
			{
				path: 'pending', component: PendingListComponent
			},
			{
				path: '', redirectTo: 'pending', pathMatch: 'full'
			},
			
		]

	}
	
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ModeratorsRoutingModule { }
