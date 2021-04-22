import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../auth/auth.guard';
import { ModeratorGuard } from '../auth/moderator.guard';
import { InitPlatformGuard } from '../auth/init-platform.guard';
import { PendingListComponent } from './pending-list/pending-list.component';
import { AddAdminComponent } from './add-admin/add-admin.component';
import { ViewAdminListComponent } from './view-admin-list/view-admin-list.component';
import { ApprovedListComponent } from './approved-list/approved-list.component';

const routes: Routes = [
	{
		path: ':lang/moderators',
		canActivateChild: [InitPlatformGuard, AuthGuard, ModeratorGuard],
		children: [
			{
				path: 'pending', component: PendingListComponent
			},
			{
				path: 'approved', component: ApprovedListComponent
			},
			{
				path: 'add-admin', component: AddAdminComponent
			},
			{
				path: 'view-admin-list', component: ViewAdminListComponent
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
