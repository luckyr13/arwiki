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
  maxLengthAddress = 43;
  settingsForm = new FormGroup({
    notes: new FormControl(
      '', [Validators.required, Validators.maxLength(this.maxLengthNote)]
    ),
    selectOption: new FormControl('', [Validators.required]),
    numericValue: new FormControl(
      0, [Validators.required, Validators.min(0)]
    ),
    stringValue: new FormControl(
      '', [Validators.required]
    ),
    recipient: new FormControl(
      '',
      [
        Validators.required,
        Validators.maxLength(this.maxLengthAddress),
        Validators.minLength(this.maxLengthAddress)
      ]
    )
  });
  loadingSubmit = false;
  @Output() working = new EventEmitter<boolean>();
  tx = '';
  error = '';
  submitVoteSubscription = Subscription.EMPTY;
  showNumericValue = false;
  showStringValue = false;
  showRecipient = false;

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

  public get selectOption() {
    return this.settingsForm.get('selectOption')!;
  }

  public get numericValue() {
    return this.settingsForm.get('numericValue')!;
  }

  public get stringValue() {
    return this.settingsForm.get('stringValue')!;
  }

  public get recipient() {
    return this.settingsForm.get('recipient')!;
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
      this.stringValue.disable();
      this.numericValue.disable();
      this.working.emit(true);
      this.loadingSubmit = true;
    } else {
      this.notes.enable();
      this.stringValue.enable();
      this.numericValue.enable();
      this.working.emit(false);
      this.loadingSubmit = false;
    }
  }

  updateValidatorsOnChange(option: string) {
    // Unset fields
    this.unsetValidatorNumericValue();
    this.unsetValidatorStringValue();
    this.unsetValidatorRecipient();

    if (option === '') {
      return;
    } else if (option === 'quorum' || option === 'support' ||
      option === 'lockMinLength' || option === 'lockMaxLength' ||
      option === 'voteLength' || option === 'pageApprovalLength' || 
      option === 'noteVoteMaxLength' || option === 'keyVoteMaxLength' || 
      option === 'roleValueVoteMaxLength' || option === 'pageSlugMaxLength' || 
      option === 'other_numeric') {
      this.setValidatorNumericValue();
    } else if (option === 'role' || option === 'communityLogo' || 
      option === 'communityDescription' || option === 'communityAppUrl' || 
      option === 'other_string') {
      this.setValidatorStringValue();
    }

    if (option === 'role') {
      this.setValidatorRecipient();
    }
    
  }

  setValidatorNumericValue() {
    this.numericValue.setValidators([
      Validators.required, Validators.min(0)
    ]);
    this.numericValue.setValue(0);
    this.numericValue.updateValueAndValidity();
    this.showNumericValue = true;
  }

  unsetValidatorNumericValue() {
    this.showNumericValue = false;
    this.numericValue.setValidators([]);
    this.numericValue.updateValueAndValidity();
  }

  setValidatorStringValue() {
    this.stringValue.setValidators([
      Validators.required
    ]);
    this.stringValue.setValue('');
    this.stringValue.updateValueAndValidity();
    this.showStringValue = true;
  }

  unsetValidatorStringValue() {
    this.showStringValue = false;
    this.stringValue.setValidators([]);
    this.stringValue.updateValueAndValidity();
  }

  setValidatorRecipient() {
    this.recipient.setValidators([
      Validators.required,
      Validators.maxLength(this.maxLengthAddress),
      Validators.minLength(this.maxLengthAddress)
    ]);
    this.recipient.setValue('');
    this.recipient.updateValueAndValidity();
    this.showRecipient = true;
  }

  unsetValidatorRecipient() {
    this.showRecipient = false;
    this.recipient.setValidators([]);
    this.recipient.updateValueAndValidity();
  }

  

}
