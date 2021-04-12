import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ViewDetailComponent } from './view-detail/view-detail.component';
import { PreviewComponent } from './preview/preview.component';
import { EditComponent } from './edit/edit.component';
import { NewComponent } from './new/new.component';

import { AuthGuard } from '../auth/auth.guard';
import { InitPlatformGuard } from '../auth/init-platform.guard';

const routes: Routes = [
	{
		path: ':lang/preview/:id', component: PreviewComponent,
		canActivate: [InitPlatformGuard]
	},
	{
		path: ':lang/create-page', component: NewComponent, 
		canActivate: [AuthGuard, InitPlatformGuard],
	},
	{
		path: ':lang/:slug', component: ViewDetailComponent,
		canActivate: [InitPlatformGuard]
	},
	{
		path: ':lang/:slug/edit', component: EditComponent, 
		canActivate: [AuthGuard, InitPlatformGuard],
	}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PageRoutingModule { }
