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
  ArwikiVotesService 
} from '../../core/arwiki-contracts/arwiki-votes.service';
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
  keyVoteMaxLength = 50;
  keyStringValueVoteMaxLength = 50;
  roleValueVoteMaxLength = 50;
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
    ),
    name: new FormControl(
      '',
      [
        Validators.required,
        Validators.maxLength(this.keyVoteMaxLength)
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
  showName = false;

  constructor(
    private _arweave: ArweaveService,
    private _tokenContract: ArwikiTokenContract,
    private _utils: UtilsService,
    private _tokenContractVotes: ArwikiVotesService,
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

  public get name() {
    return this.settingsForm.get('name')!;
  }

  ngOnInit() {
    
  }

  ngOnDestroy() {
    this.submitVoteSubscription.unsubscribe();
  }

  onSubmit() {
    const note: string = this.notes.value!.trim();
    const option: string = this.selectOption.value!.trim();
    let value: string|number = '';
    let recipient = '';
    let keyName = this.selectOption.value!;
    this.disableForm(true);

    if (option === 'quorum' || option === 'support' ||
      option === 'lockMinLength' || option === 'lockMaxLength' ||
      option === 'voteLength' || option === 'pageApprovalLength' || 
      option === 'noteVoteMaxLength' || option === 'keyVoteMaxLength' || 
      option === 'roleValueVoteMaxLength' || option === 'pageSlugMaxLength' || 
      option === 'other_numeric') {
      value = +this.numericValue.value!;
    } else if (option === 'communityLogo' || 
      option === 'communityDescription' || option === 'communityAppUrl' || 
      option === 'other_string' || option === 'role') {
      value = this.stringValue.value!.trim();
    }
    if (option === 'role') {
      recipient = this.recipient.value!;
    }
    if (option === 'other_string' || option === 'other_numeric') {
      keyName = this.name.value!;
    }

    const jwk = this._auth.getPrivateKey();

    this.submitVoteSubscription = this._tokenContractVotes
      .addVoteSetSettings(
        keyName,
        note,
        value,
        recipient,
        jwk,
        arwikiVersion[0])
      .subscribe({
        next: (res) => {
          let tx = '';
          if (res && Object.prototype.hasOwnProperty.call(res, 'originalTxId')) {
            tx = res.originalTxId;
          } else if (res && Object.prototype.hasOwnProperty.call(res, 'bundlrResponse') &&
            res.bundlrResponse && Object.prototype.hasOwnProperty.call(res.bundlrResponse, 'id')) {
            tx = res.bundlrResponse.id;
          }
          this.tx = tx;
          this.disableForm(false);
        },
        error: (error) => {
          this.error = 'Error creating vote!';
          this.disableForm(false);
          if (typeof error === 'string') {
            this._utils.message(error, 'error');
          } else if (error && Object.prototype.hasOwnProperty.call(error, 'message')) {
            this._utils.message(error.message, 'error');
          }
          console.error('newVote', error);
        }
      });
 
  }

  formatBlocks(len: number): string {
    return this._arweave.formatBlocks(len);
  }

  disableForm(disable: boolean) {
    if (disable) {
      this.notes.disable();
      this.stringValue.disable();
      this.numericValue.disable();
      this.recipient.disable();
      this.selectOption.disable();
      this.name.disable();
      this.working.emit(true);
      this.loadingSubmit = true;
    } else {
      this.notes.enable();
      this.stringValue.enable();
      this.numericValue.enable();
      this.recipient.enable();
      this.selectOption.enable();
      this.name.enable();
      this.working.emit(false);
      this.loadingSubmit = false;
    }
  }

  updateValidatorsOnChange(option: string) {
    // Unset fields
    this.unsetValidatorNumericValue();
    this.unsetValidatorStringValue();
    this.unsetValidatorRecipient();
    this.unsetValidatorName();

    if (option === '') {
      return;
    } else if (option === 'quorum' || option === 'support' ||
      option === 'lockMinLength' || option === 'lockMaxLength' ||
      option === 'voteLength' || option === 'pageApprovalLength' || 
      option === 'noteVoteMaxLength' || option === 'keyVoteMaxLength' || 
      option === 'roleValueVoteMaxLength' || option === 'pageSlugMaxLength' || 
      option === 'other_numeric') {
      this.setValidatorNumericValue();
    } else if (option === 'communityLogo' || 
      option === 'communityDescription' || option === 'communityAppUrl' || 
      option === 'other_string') {
      this.setValidatorStringValue(this.keyStringValueVoteMaxLength);
    }

    if (option === 'role') {
      this.setValidatorStringValue(this.roleValueVoteMaxLength);
      this.setValidatorRecipient();
    }
    if (option === 'other_string' || option === 'other_numeric') {
      this.setValidatorName();
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

  setValidatorStringValue(maxLength: number) {
    const validators = [
      Validators.required
    ];
    if (maxLength) {
      validators.push(Validators.maxLength(maxLength));
    }
    this.stringValue.setValidators(validators);
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

  setValidatorName() {
    this.name.setValidators([
      Validators.required,
      Validators.maxLength(this.keyVoteMaxLength)
    ]);
    this.name.setValue('');
    this.name.updateValueAndValidity();
    this.showName = true;
  }

  unsetValidatorName() {
    this.showName = false;
    this.name.setValidators([]);
    this.name.updateValueAndValidity();
  }

  replaceKeyNameVal() {
    this.name.setValue(this.name.value!.trim().replace(/ /g, '-'));
  }

  

}
