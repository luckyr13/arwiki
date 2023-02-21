import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppInfoComponent } from './app-info/app-info.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'app-info',
        component: AppInfoComponent
      },
      {
        path: '', redirectTo: 'app-info', pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }
