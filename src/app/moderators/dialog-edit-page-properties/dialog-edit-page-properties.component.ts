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
import { ArwikiPagesService } from '../../core/arwiki-contracts/arwiki-pages.service';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import { ArwikiMenuService } from '../../core/arwiki-contracts/arwiki-menu.service';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import {
  DialogCreateNftComponent 
} from '../dialog-create-nft/dialog-create-nft.component';
import { MatDialog } from '@angular/material/dialog';
import { UserSettingsService } from '../../core/user-settings.service';
import { Direction } from '@angular/cdk/bidi';

@Component({
  selector: 'app-dialog-edit-page-properties',
  templateUrl: './dialog-edit-page-properties.component.html',
  styleUrls: ['./dialog-edit-page-properties.component.scss']
})
export class DialogEditPagePropertiesComponent implements OnInit, OnDestroy {
  maxLengthLangCode = 2;
  maxLengthArweaveAddress = 43;
  editPagePropertiesForm = new FormGroup({
    slug: new FormControl(
      '',
      [
        Validators.required
      ]
    ),
    languageCode: new FormControl(
      '',
      [
        Validators.required,
        Validators.maxLength(this.maxLengthLangCode),
        Validators.minLength(this.maxLengthLangCode)
      ]
    ),
    order: new FormControl(
      0,
      [
        Validators.required,
        Validators.min(0)
      ]
    ),
    nft: new FormControl(
      '',
      [
        Validators.maxLength(this.maxLengthArweaveAddress),
        Validators.minLength(this.maxLengthArweaveAddress)
      ]
    ),
    showInMenu: new FormControl(
      false,
      [
        Validators.required
      ]
    ),
    showInMainPage: new FormControl(
      false,
      [
        Validators.required
      ]
    ),
    showInFooter: new FormControl(
      false,
      [
        Validators.required
      ]
    ),
  });
  loadingSubmit = false;
  tx = '';
  error = '';
  submitSubscription = Subscription.EMPTY;

  constructor(
    private _arweave: ArweaveService,
    private _arwikiPages: ArwikiPagesService,
    private _utils: UtilsService,
    private _auth: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: {
      langCode: string,
      page: ArwikiPage
    },
    private _arwikiMenu: ArwikiMenuService,
    private _dialog: MatDialog,
    private _userSettings: UserSettingsService) {
  }

  public get slug() {
    return this.editPagePropertiesForm.get('slug')!;
  }

  public get languageCode() {
    return this.editPagePropertiesForm.get('languageCode')!;
  }

  public get order() {
    return this.editPagePropertiesForm.get('order')!;
  }

  public get nft() {
    return this.editPagePropertiesForm.get('nft')!;
  }

  public get showInMenu() {
    return this.editPagePropertiesForm.get('showInMenu')!;
  }

  public get showInMainPage() {
    return this.editPagePropertiesForm.get('showInMainPage')!;
  }

  public get showInFooter() {
    return this.editPagePropertiesForm.get('showInFooter')!;
  }

  ngOnInit() {
    this.languageCode.setValue(this.data.langCode);
    this.languageCode.disable();
    const reload = false;
    this.initFormValues(this.data.page);
  }

  ngOnDestroy() {
    this.submitSubscription.unsubscribe();
  }


  onSubmit() {
    const slug: string = this.data.page.slug.trim();
    const languageCode: string = this.data.langCode;
    const order: number = +this.order.value!;
    const nft: string = this.nft.value!;
    const showInMenu: boolean = this.showInMenu.value!;
    const showInFooter: boolean = this.showInFooter.value!;
    const showInMainPage: boolean = this.showInMainPage.value!;
    this.disableForm(true);

    const jwk = this._auth.getPrivateKey();
    

    this.submitSubscription = this._arwikiPages
      .updatePageProperties(
        slug,
        order,
        nft,
        showInMenu,
        showInMainPage,
        showInFooter,
        languageCode,
        jwk,
        arwikiVersion[0]
      ).subscribe({
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
          this.error = 'Error updating properties!';
          this.disableForm(false);
          if (typeof error === 'string') {
            this._utils.message(error, 'error');
          } else if (error && Object.prototype.hasOwnProperty.call(error, 'message')) {
            this._utils.message(error.message, 'error');
          }
          console.error('updatePageProperties', error);
        }
      });
      
  }

  disableForm(disable: boolean) {
    if (disable) {
      this.order.disable();
      this.nft.disable();
      this.showInMenu.disable();
      this.showInMainPage.disable();
      this.showInFooter.disable();
      this.loadingSubmit = true;
    } else {
      this.order.enable();
      this.nft.enable();
      this.showInMenu.enable();
      this.showInMainPage.enable();
      this.showInFooter.enable();
      this.loadingSubmit = false;
    }
  }

  initFormValues(page: ArwikiPage) {
    const order = page.order ? page.order : 0;
    this.slug.disable();
    this.slug.setValue(page.slug);
    this.order.setValue(order);
    this.nft.setValue(page.nft!);
    this.showInMenu.setValue(page.showInMenu!);
    this.showInMainPage.setValue(page.showInMainPage!);
    this.showInFooter.setValue(page.showInFooter!);
  }


  openCreateNftModal(slug: string, langCode: string) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';


    const dialogRef = this._dialog.open(DialogCreateNftComponent, {
      width: '650px',
      data: {
        langCode: langCode,
        slug: slug,
        img: this.data.page.img,
        sponsor: this.data.page.sponsor,
        title: this.data.page.title,
      },
      direction: direction,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((tx: string) => {
      if (tx) {
        // Insert tx id
        this.nft.setValue(tx);
      }
    });
  }

}