import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ArweaveService } from '../../core/arweave.service';
import { Subscription } from 'rxjs';
import { 
  ArwikiTokenContract 
} from '../../core/arwiki-contracts/arwiki-token.service';
import { UtilsService } from '../../core/utils.service';

@Component({
  selector: 'app-form-mint',
  templateUrl: './form-mint.component.html',
  styleUrls: ['./form-mint.component.scss']
})
export class FormMintComponent implements OnInit, OnDestroy {
  mintForm = new FormGroup({
    recipient: new FormControl(
      '', [Validators.required, Validators.maxLength(43)]
    ),
    qty: new FormControl(1, [Validators.required, Validators.min(1)]),
    lockLength: new FormControl(0, [Validators.required]),
    lockTokens: new FormControl(true),
    notes: new FormControl(
      '', [Validators.required, Validators.maxLength(200)]
    )
  });
  lockMinLength = 0;
  lockMaxLength = 0;
  getContractSettingsSubscription = Subscription.EMPTY;
  loading = false;

  constructor(
    private _arweave: ArweaveService,
    private _tokenContract: ArwikiTokenContract,
    private _utils: UtilsService) {
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
  }


  onSubmit() {
    alert('test')

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
