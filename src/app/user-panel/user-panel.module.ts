import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SharedModule } from '../shared/shared.module';
import { UserPanelRoutingModule } from './user-panel-routing.module';
import { PstInfoComponent } from './pst-info/pst-info.component';
import { CommunityMembersComponent } from './community-members/community-members.component';
import { ModeratorsListComponent } from './moderators-list/moderators-list.component';


@NgModule({
  declarations: [
    DashboardComponent,
    PstInfoComponent,
    CommunityMembersComponent,
    ModeratorsListComponent,
  ],
  imports: [
    CommonModule,
    UserPanelRoutingModule,
    SharedModule
  ]
})
export class UserPanelModule { }
