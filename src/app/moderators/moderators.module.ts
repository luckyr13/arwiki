import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { ModeratorsRoutingModule } from './moderators-routing.module';
import { PendingListComponent } from './pending-list/pending-list.component';
import { MenuComponent } from './menu/menu.component';


@NgModule({
  declarations: [PendingListComponent, MenuComponent],
  imports: [
    CommonModule,
    ModeratorsRoutingModule,
    SharedModule
  ]
})
export class ModeratorsModule { }
