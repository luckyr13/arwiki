import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';

import { SettingsRoutingModule } from './settings-routing.module';
import { AppInfoComponent } from './app-info/app-info.component';
import { SettingsComponent } from './settings.component';
import { NetworkComponent } from './network/network.component';
import { PrivacyComponent } from './privacy/privacy.component';


@NgModule({
  declarations: [
    AppInfoComponent,
    SettingsComponent,
    NetworkComponent,
    PrivacyComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    SettingsRoutingModule,
  ]
})
export class SettingsModule { }
