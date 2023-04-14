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
import { ArwikiCategoriesService } from '../../core/arwiki-contracts/arwiki-categories.service';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import { ArwikiMenuService } from '../../core/arwiki-contracts/arwiki-menu.service';
import { ArwikiCategory } from '../../core/interfaces/arwiki-category';


@Component({
  selector: 'app-dialog-new-category',
  templateUrl: './dialog-new-category.component.html',
  styleUrls: ['./dialog-new-category.component.scss']
})
export class DialogNewCategoryComponent implements OnInit, OnDestroy {
  maxLengthLabel = 50;
  maxLengthSlug = 50;
  maxLengthLangCode = 2;
  newCategoryForm = new FormGroup({
    label: new FormControl(
      '',
      [
        Validators.required,
        Validators.maxLength(this.maxLengthLabel)
      ]
    ),
    slug: new FormControl(
      '',
      [
        Validators.required,
        Validators.maxLength(this.maxLengthSlug)
      ]
    ),
    parent: new FormControl(''),
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
    )
  });
  loadingSubmit = false;
  tx = '';
  error = '';
  submitSubscription = Subscription.EMPTY;
  categoryListSubscription = Subscription.EMPTY;
  categoryList: ArwikiCategory[] = [];

  constructor(
    private _arweave: ArweaveService,
    private _arwikiCategories: ArwikiCategoriesService,
    private _utils: UtilsService,
    private _auth: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: {
      langCode: string
    },
    private _arwikiMenu: ArwikiMenuService) {
  }

  public get label() {
    return this.newCategoryForm.get('label')!;
  }

  public get slug() {
    return this.newCategoryForm.get('slug')!;
  }

  public get parent() {
    return this.newCategoryForm.get('parent')!;
  }

  public get order() {
    return this.newCategoryForm.get('order')!;
  }

  public get languageCode() {
    return this.newCategoryForm.get('languageCode')!;
  }

  ngOnInit() {
    this.languageCode.setValue(this.data.langCode);
    this.languageCode.disable();
    this.loadCategories();
  }

  ngOnDestroy() {
    this.submitSubscription.unsubscribe();
    this.categoryListSubscription.unsubscribe();
  }


  onSubmit() {
    const label: string = this.label.value!.trim();
    const slug: string = this.slug.value!.trim();
    const parent: string = this.parent.value!.trim();
    const order: number = this.order.value!;
    const languageCode: string = this.data.langCode;
    
    this.disableForm(true);

    const jwk = this._auth.getPrivateKey();
    
    this.submitSubscription = this._arwikiCategories
      .addCategory(
        label,
        slug,
        parent,
        order,
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
          this.error = 'Error adding category!';
          this.disableForm(false);
          if (typeof error === 'string') {
            this._utils.message(error, 'error');
          } else if (error && Object.prototype.hasOwnProperty.call(error, 'message')) {
            this._utils.message(error.message, 'error');
          }
          console.error('addCategory', error);
        }
      });
      
  }

  formatBlocks(len: number): string {
    return this._arweave.formatBlocks(len);
  }

  disableForm(disable: boolean) {
    if (disable) {
      this.label.disable();
      this.slug.disable();
      this.parent.disable();
      this.order.disable();
      this.loadingSubmit = true;
    } else {
      this.label.enable();
      this.slug.enable();
      this.parent.enable();
      this.order.enable();
      this.loadingSubmit = false;
    }
  }

    loadCategories(reload: boolean = false) {
    const langCode = this.data.langCode;
    const onlyActiveCategories = true;
    this.categoryListSubscription = this._arwikiCategories.getCategories(
      langCode,
      onlyActiveCategories
    ).subscribe({
      next: (categories) => {
        const menu = this._arwikiMenu.generateMenu(
          {...categories},
          {}
        );

        this.categoryList = this._arwikiMenu.flatMenu(menu, categories);
      },
      error: (error) => {
        this._utils.message(error, 'error');
      }
    })

  }

  transformSlug(slug: string) {
    let newSlug = slug.trim().toLowerCase();
    newSlug = newSlug.replace(/ /gi, '_');
    newSlug = newSlug.replace(/[^A-Za-z0-9-_]/gi, '')
    this.slug.setValue(newSlug);
  }


}
