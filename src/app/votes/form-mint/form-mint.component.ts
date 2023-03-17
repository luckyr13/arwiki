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
  selector: 'app-form-mint',
  templateUrl: './form-mint.component.html',
  styleUrls: ['./form-mint.component.scss']
})
export class FormMintComponent implements OnInit, OnDestroy {
  maxLengthAddress = 43;
  maxLengthNote = 200;
  mintForm = new FormGroup({
    recipient: new FormControl(
      '', [
        Validators.required,
        Validators.maxLength(this.maxLengthAddress),
        Validators.minLength(this.maxLengthAddress)
      ]
    ),
    qty: new FormControl(1, [Validators.required, Validators.min(1)]),
    lockLength: new FormControl(0, [Validators.required]),
    lockTokens: new FormControl(true),
    notes: new FormControl(
      '', [Validators.required, Validators.maxLength(this.maxLengthNote)]
    )
  });
  lockMinLength = 0;
  lockMaxLength = 0;
  getContractSettingsSubscription = Subscription.EMPTY;
  loading = false;
  loadingSubmit = false;
  @Output() working = new EventEmitter<boolean>();
  tx = '';
  error = '';
  submitVoteSubscription = Subscription.EMPTY;

  constructor(
    private _arweave: ArweaveService,
    private _tokenContract: ArwikiTokenContract,
    private _tokenContractVotes: ArwikiVotesService,
    private _utils: UtilsService,
    private _auth: AuthService) {
  }

  public get recipient() {
    return this.mintForm.get('recipient')!;
  }

  public get qty() {
    return this.mintForm.get('qty')!;
  }

  public get lockLength() {
    return this.mintForm.get('lockLength')!;
  }

  public get lockTokens() {
    return this.mintForm.get('lockTokens')!;
  }

  public get notes() {
    return this.mintForm.get('notes')!;
  }

  ngOnInit() {
    this.loading = true;
    this.getContractSettingsSubscription = this._tokenContract.getSettings()
      .subscribe({
        next: (settings) => {
          this.lockMinLength = settings.get('lockMinLength') || 0;
          this.lockMaxLength = settings.get('lockMaxLength') || 0;

          if (this.lockMinLength && this.lockMaxLength) {
            this.lockLength.setValidators([
              Validators.min(this.lockMinLength),
              Validators.max(this.lockMaxLength)
            ]);
            this.lockLength.setValue(this.lockMinLength);
            this.lockLength.updateValueAndValidity();
          }

          this.loading = false;

        },
        error: (error) => {
          this._utils.message('Error loading settings');
          this.loading = false;
          console.error('FormMint', error);
        }
      });
    
  }

  ngOnDestroy() {
    this.getContractSettingsSubscription.unsubscribe();
    this.submitVoteSubscription.unsubscribe();
  }

  onSubmit() {
    const recipient: string = this.recipient.value!.trim();
    const qty: number = this.qty.value!;
    const lockLength: number = this.lockTokens.value! ?
      this.lockLength.value! : 0;
    const note: string = this.notes.value!.trim();

    if (!this._arweave.validateAddress(recipient)) {
      alert('Invalid arweave address!')
      return;
    }

    this.disableForm(true);

    const jwk = this._auth.getPrivateKey();
    this.submitVoteSubscription = this._tokenContractVotes
      .addVoteMintTokens(
        recipient,
        qty,
        lockLength,
        note,
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


  disableForm(disable: boolean) {
    if (disable) {
      this.recipient.disable();
      this.qty.disable();
      this.lockLength.disable();
      this.lockTokens.disable();
      this.notes.disable();
      this.working.emit(true);
      this.loadingSubmit = true;

    } else {
      this.recipient.enable();
      this.qty.enable();
      this.lockLength.enable();
      this.lockTokens.enable();
      this.notes.enable();
      this.working.emit(false);
      this.loadingSubmit = false;
    }
  }

  formatBlocks(len: number): string {
    return this._arweave.formatBlocks(len);
  }

  lockTokenFields(lock: boolean) {
    if (!lock) {
      this.lockLength.disable();
    } else {
      this.lockLength.enable();
    }
  }
}
