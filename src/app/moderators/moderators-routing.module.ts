import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../auth/auth.guard';
import { ModeratorGuard } from '../auth/moderator.guard';
import { PendingListComponent } from './pending-list/pending-list.component';
import { AddAdminComponent } from './add-admin/add-admin.component';
import { ViewAdminListComponent } from './view-admin-list/view-admin-list.component';
import { ApprovedListComponent } from './approved-list/approved-list.component';
import { DeletedListComponent } from './deleted-list/deleted-list.component';
import { TagManagerComponent } from './tag-manager/tag-manager.component';
import { PageUpdatesComponent } from './page-updates/page-updates.component';
import { ActivityHistoryComponent } from './activity-history/activity-history.component';
import { LanguagesComponent } from './languages/languages.component';
import { CategoriesComponent } from './categories/categories.component';
import { PagesComponent } from './pages/pages.component';

const routes: Routes = [
	{
		path: '',
		canActivateChild: [AuthGuard, ModeratorGuard],
		children: [
			{
				path: 'pending', component: PendingListComponent
			},
			{
				path: 'approved', component: ApprovedListComponent
			},
			{
				path: 'deleted', component: DeletedListComponent
			},
			{
				path: 'tag-manager/:slug', component: TagManagerComponent
			},
			{
				path: 'page-updates/:slug', component: PageUpdatesComponent
			},
			{
				path: 'add-admin', component: AddAdminComponent
			},
			{
				path: 'view-admin-list', component: ViewAdminListComponent
			},
			{
				path: 'languages', component: LanguagesComponent
			},
			{
				path: 'categories', component: CategoriesComponent
			},
			{
				path: 'categories/:slug', component: PagesComponent
			},
			{
				path: '', redirectTo: 'pending', pathMatch: 'full'
			}
		]
	},
	{
		path: 'activity-history/:address',
		component: ActivityHistoryComponent
	}
	
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ModeratorsRoutingModule { }
