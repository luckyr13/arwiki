import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModeratorsRoutingModule } from './moderators-routing.module';
import { PendingListComponent } from './pending-list/pending-list.component';


@NgModule({
  declarations: [PendingListComponent],
  imports: [
    CommonModule,
    ModeratorsRoutingModule
  ]
})
export class ModeratorsModule { }
