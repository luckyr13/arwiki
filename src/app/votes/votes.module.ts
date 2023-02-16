import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';

import { VotesRoutingModule } from './votes-routing.module';
import { ListComponent } from './list/list.component';
import { DialogVotedComponent } from './dialog-voted/dialog-voted.component';
import { DialogNewVoteComponent } from './dialog-new-vote/dialog-new-vote.component';
import { FormMintComponent } from './form-mint/form-mint.component';
import { FormBurnVaultComponent } from './form-burn-vault/form-burn-vault.component';
import { FormSetSettingsComponent } from './form-set-settings/form-set-settings.component';
import { FormIndicativeComponent } from './form-indicative/form-indicative.component';


@NgModule({
  declarations: [
    ListComponent,
    DialogVotedComponent,
    DialogNewVoteComponent,
    FormMintComponent,
    FormBurnVaultComponent,
    FormSetSettingsComponent,
    FormIndicativeComponent
  ],
  imports: [
    CommonModule,
    VotesRoutingModule,
    SharedModule
  ]
})
export class VotesModule { }
