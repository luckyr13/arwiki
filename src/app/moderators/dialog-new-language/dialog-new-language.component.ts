import { 
  Component, OnInit, OnDestroy,
  Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ArweaveService } from '../../core/arweave.service';
import { Subscription } from 'rxjs';
import { UtilsService } from '../../core/utils.service';
import { 
  arwikiVersion 
} from '../../core/arwiki';
import { 
  AuthService 
} from '../../auth/auth.service';
import { ArwikiTokenLangsService } from '../../core/arwiki-contracts/arwiki-langs.service';


@Component({
  selector: 'app-dialog-new-language',
  templateUrl: './dialog-new-language.component.html',
  styleUrls: ['./dialog-new-language.component.scss']
})
export class DialogNewLanguageComponent implements OnInit, OnDestroy {
  maxLengthCode = 2;
  maxLengthNativeName = 50;
  maxLengthISOName = 50;
  newLanguageForm = new FormGroup({
    code: new FormControl(
      '',
      [
        Validators.required,
        Validators.maxLength(this.maxLengthCode),
        Validators.minLength(this.maxLengthCode)
      ]
    ),
    writing_system: new FormControl('', [Validators.required]),
    native_name: new FormControl(
      '',
      [
        Validators.required,
        Validators.maxLength(this.maxLengthNativeName)
      ]
    ),
    iso_name: new FormControl(
      '',
      [
        Validators.required,
        Validators.maxLength(this.maxLengthISOName)
      ]
    )
  });
  loadingSubmit = false;
  tx = '';
  error = '';
  submitLangSubscription = Subscription.EMPTY;

  constructor(
    private _arweave: ArweaveService,
    private _tokenLangsContract: ArwikiTokenLangsService,
    private _utils: UtilsService,
    private _auth: AuthService) {
  }

  public get code() {
    return this.newLanguageForm.get('code')!;
  }

  public get writing_system() {
    return this.newLanguageForm.get('writing_system')!;
  }

  public get native_name() {
    return this.newLanguageForm.get('native_name')!;
  }

  public get iso_name() {
    return this.newLanguageForm.get('iso_name')!;
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.submitLangSubscription.unsubscribe();
  }


  onSubmit() {
    const code: string = this.code.value!.trim();
    const writing_system: string = this.writing_system.value!.trim();
    const native_name: string = this.native_name.value!.trim();
    const iso_name: string = this.iso_name.value!.trim();
    this.disableForm(true);

    const jwk = this._auth.getPrivateKey();
    
    this.submitLangSubscription = this._tokenLangsContract
      .addLanguage(
        code,
        writing_system,
        native_name,
        iso_name,
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
          this.error = 'Error adding language!';
          this.disableForm(false);
          if (typeof error === 'string') {
            this._utils.message(error, 'error');
          } else if (error && Object.prototype.hasOwnProperty.call(error, 'message')) {
            this._utils.message(error.message, 'error');
          }
          console.error('addLanguage', error);
        }
      });
      
  }

  formatBlocks(len: number): string {
    return this._arweave.formatBlocks(len);
  }

  disableForm(disable: boolean) {
    if (disable) {
      this.code.disable();
      this.writing_system.disable();
      this.native_name.disable();
      this.iso_name.disable();
      this.loadingSubmit = true;
    } else {
      this.code.enable();
      this.writing_system.enable();
      this.native_name.enable();
      this.iso_name.enable();
      this.loadingSubmit = false;
    }
  }

}
