import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SharedModule } from '../shared/shared.module';
import { UserPanelRoutingModule } from './user-panel-routing.module';
import { PstInfoComponent } from './pst-info/pst-info.component';


@NgModule({
  declarations: [
    DashboardComponent,
    PstInfoComponent,
  ],
  imports: [
    CommonModule,
    UserPanelRoutingModule,
    SharedModule
  ]
})
export class UserPanelModule { }
