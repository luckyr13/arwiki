import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExploreComponent } from './explore/explore.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'explore', component: ExploreComponent },
      {
        path: '', redirectTo: 'explore', pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BadgesRoutingModule { }
