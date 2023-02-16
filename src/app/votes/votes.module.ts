import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';

import { VotesRoutingModule } from './votes-routing.module';
import { ListComponent } from './list/list.component';
import { DialogVotedComponent } from './dialog-voted/dialog-voted.component';
import { DialogNewVoteComponent } from './dialog-new-vote/dialog-new-vote.component';


@NgModule({
  declarations: [
    ListComponent,
    DialogVotedComponent,
    DialogNewVoteComponent
  ],
  imports: [
    CommonModule,
    VotesRoutingModule,
    SharedModule
  ]
})
export class VotesModule { }
