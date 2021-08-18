import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SharedModule } from '../shared/shared.module';
import { UserPanelRoutingModule } from './user-panel-routing.module';


@NgModule({
  declarations: [
    DashboardComponent,
  ],
  imports: [
    CommonModule,
    UserPanelRoutingModule,
    SharedModule
  ]
})
export class UserPanelModule { }
