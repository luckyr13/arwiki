import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { CookiesPolicyComponent } from './cookies-policy/cookies-policy.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'privacy-policy', component: PrivacyPolicyComponent },
      { path: 'cookies-policy', component: CookiesPolicyComponent },
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
export class InfoRoutingModule { }
