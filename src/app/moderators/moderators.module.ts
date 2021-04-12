import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModeratorsRoutingModule } from './moderators-routing.module';
import { PendingListComponent } from './pending-list/pending-list.component';
import { MenuComponent } from './menu/menu.component';


@NgModule({
  declarations: [PendingListComponent, MenuComponent],
  imports: [
    CommonModule,
    ModeratorsRoutingModule
  ]
})
export class ModeratorsModule { }
