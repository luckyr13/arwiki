import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ViewDetailComponent } from './view-detail/view-detail.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: ':address', component: ViewDetailComponent
      },
      {
        path: '', component: ViewDetailComponent
      },
    ]

  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserProfileRoutingModule { }
