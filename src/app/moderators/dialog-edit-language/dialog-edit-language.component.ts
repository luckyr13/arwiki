import { 
  Component, OnInit, OnDestroy,
  Output, EventEmitter, Inject } from '@angular/core';
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
import { ArwikiLangsService } from '../../core/arwiki-contracts/arwiki-langs.service';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import { ArwikiLang } from '../../core/interfaces/arwiki-lang';

@Component({
  selector: 'app-dialog-edit-language',
  templateUrl: './dialog-edit-language.component.html',
  styleUrls: ['./dialog-edit-language.component.scss']
})
export class DialogEditLanguageComponent implements OnInit, OnDestroy {
  maxLengthCode = 2;
  maxLengthNativeName = 50;
  maxLengthISOName = 50;
  editLanguageForm = new FormGroup({
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
    ),
    active: new FormControl(
      true,
      [
        Validators.required
      ]
    )
  });
  loadingSubmit = false;
  tx = '';
  error = '';
  submitLangSubscription = Subscription.EMPTY;

  constructor(
    private _arweave: ArweaveService,
    private _tokenLangsContract: ArwikiLangsService,
    private _utils: UtilsService,
    private _auth: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: {
      language: ArwikiLang
    }) {
  }

  public get code() {
    return this.editLanguageForm.get('code')!;
  }

  public get writing_system() {
    return this.editLanguageForm.get('writing_system')!;
  }

  public get native_name() {
    return this.editLanguageForm.get('native_name')!;
  }

  public get iso_name() {
    return this.editLanguageForm.get('iso_name')!;
  }

  public get active() {
    return this.editLanguageForm.get('active')!;
  }

  ngOnInit() {
    const language: ArwikiLang = this.data.language;
    // Init form values
    this.code.disable();
    this.code.setValue(language.code);
    this.writing_system.setValue(language.writing_system);
    this.native_name.setValue(language.native_name);
    this.iso_name.setValue(language.iso_name);
    this.active.setValue(language.active);
  }

  ngOnDestroy() {
    this.submitLangSubscription.unsubscribe();
  }


  onSubmit() {
    const code: string = this.code.value!.trim();
    const writing_system: string = this.writing_system.value!.trim();
    const native_name: string = this.native_name.value!.trim();
    const iso_name: string = this.iso_name.value!.trim();
    const active: boolean = this.active.value!;
    this.disableForm(true);

    const jwk = this._auth.getPrivateKey();
    
    this.submitLangSubscription = this._tokenLangsContract
      .updateLanguage(
        code,
        writing_system,
        native_name,
        iso_name,
        active,
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
          this.error = 'Error updating language!';
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
      this.active.disable();
      this.loadingSubmit = true;
    } else {
      this.code.enable();
      this.writing_system.enable();
      this.native_name.enable();
      this.iso_name.enable();
      this.active.enable();
      this.loadingSubmit = false;
    }
  }

}
