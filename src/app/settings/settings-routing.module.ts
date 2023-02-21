import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppInfoComponent } from './app-info/app-info.component';
import { SettingsComponent } from './settings.component';
import { NetworkComponent } from './network/network.component';
import { PrivacyComponent } from './privacy/privacy.component';

const routes: Routes = 
[
  {
    path: '',
    component: SettingsComponent,
    children: [
      { path: 'app-info', component: AppInfoComponent },
      { path: 'network', component: NetworkComponent },
      { path: 'privacy', component: PrivacyComponent },
      { path: '', pathMatch: 'full', redirectTo: 'app-info' } 
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }
