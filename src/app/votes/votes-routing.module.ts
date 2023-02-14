import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
import { AuthGuard } from '../auth/auth.guard';
import { InitPlatformGuard } from '../auth/init-platform.guard';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'list',
        component: ListComponent,
        canActivate: [AuthGuard, InitPlatformGuard],
      },
      {
        path: '', redirectTo: 'list', pathMatch: 'full'
      }
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VotesRoutingModule { }
