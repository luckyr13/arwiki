import {
  Component, OnInit, OnDestroy,
  Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ArweaveService } from '../../core/arweave.service';
import { Subscription } from 'rxjs';
import { 
  ArwikiTokenContract 
} from '../../core/arwiki-contracts/arwiki-token.service';
import { UtilsService } from '../../core/utils.service';
import { 
  ArwikiTokenVotesService 
} from '../../core/arwiki-contracts/arwiki-token-votes.service';
import { 
  arwikiVersion 
} from '../../core/arwiki';
import { 
  AuthService 
} from '../../auth/auth.service';

@Component({
  selector: 'app-form-set-settings',
  templateUrl: './form-set-settings.component.html',
  styleUrls: ['./form-set-settings.component.scss']
})
export class FormSetSettingsComponent implements OnInit, OnDestroy {
  maxLengthNote = 200;
  settingsForm = new FormGroup({
    notes: new FormControl(
      '', [Validators.required, Validators.maxLength(this.maxLengthNote)]
    )
  });
  loadingSubmit = false;
  @Output() working = new EventEmitter<boolean>();
  tx = '';
  error = '';
  submitVoteSubscription = Subscription.EMPTY;

  constructor(
    private _arweave: ArweaveService,
    private _tokenContract: ArwikiTokenContract,
    private _utils: UtilsService,
    private _tokenContractVotes: ArwikiTokenVotesService,
    private _auth: AuthService) {
  }

  public get notes() {
    return this.settingsForm.get('notes')!;
  }

  ngOnInit() {
    
  }

  ngOnDestroy() {
    this.submitVoteSubscription.unsubscribe();
  }

  onSubmit() {
    const note: string = this.notes.value!.trim();
    this.disableForm(true);

    const jwk = this._auth.getPrivateKey();
 
  }

  formatBlocks(len: number): string {
    return this._arweave.formatBlocks(len);
  }

  disableForm(disable: boolean) {
    if (disable) {
      this.notes.disable();
      this.working.emit(true);
      this.loadingSubmit = true;
    } else {
      this.notes.enable();
      this.working.emit(false);
      this.loadingSubmit = false;
    }
  }
}
