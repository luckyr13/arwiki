import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { AuthService } from '../auth/auth.service';
import { UserSettingsService } from '../auth/user-settings.service';
import { ArweaveService } from '../auth/arweave.service';
import { MatDialog } from '@angular/material/dialog';
import {
  ModalFileManagerComponent 
} from '../shared/modal-file-manager/modal-file-manager.component';
import { FormGroup, FormControl } from '@angular/forms';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { Subscription } from 'rxjs'; 
import { ArwikiCategoriesContract } from '../arwiki-contracts/arwiki-categories';
import { ArwikiPagesContract } from '../arwiki-contracts/arwiki-pages';
import { ArwikiLangIndexContract } from '../arwiki-contracts/arwiki-lang-index';

import * as SimpleMDE from 'simplemde';
declare const document: any;

@Component({
  selector: 'app-create-page',
  templateUrl: './create-page.component.html',
  styleUrls: ['./create-page.component.scss']
})
export class CreatePageComponent implements OnInit, OnDestroy {
	public authorAddress: string = this._auth.getMainAddressSnapshot();
	defaultTheme: string = '';
	loadingFrm: boolean = false;
	frmNew: FormGroup = new FormGroup({
		title: new FormControl('', [Validators.required, Validators.maxLength(150)]),
		slug: new FormControl('', [Validators.required, Validators.maxLength(150)]),
    category: new FormControl('', [Validators.required]),
    language: new FormControl('', [Validators.required])
	});
	txmessage: string = '';
  previewImgUrl: string = '';
  simplemde: any;
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  contentTextareaObject: any;
  baseImgUrl: string = this._arweave.baseURL;
  categoryList: any[] = [];
  languageList: any[] = [];
  categoryListSubscription: Subscription = Subscription.EMPTY;
  languageListSubscription: Subscription = Subscription.EMPTY;


  public get title() {
		return this.frmNew.get('title');
	}
	public get slug() {
		return this.frmNew.get('slug');
	}
	public get category() {
		return this.frmNew.get('category');
	}
  public get language() {
    return this.frmNew.get('language');
  }

	goBack() {
  	this._location.back();
  }

  constructor(
  	private _location: Location,
    private _userSettings: UserSettingsService,
    private _arweave: ArweaveService,
    private _auth: AuthService,
    public _dialog: MatDialog,
  	private _router: Router,
  	private _snackBar: MatSnackBar,
    private _langIndexContract: ArwikiLangIndexContract,
    private _categoriesContract: ArwikiCategoriesContract
  ) { }

  ngOnInit(): void {
  	this.getDefaultTheme();
    this.contentTextareaObject = document.getElementById("create-page-textarea-simplemde-content");
    this.simplemde = new SimpleMDE({
      element: this.contentTextareaObject
    });

    this.categoryListSubscription = this._categoriesContract
      .getState(this._arweave.arweave)
      .subscribe({
        next: (state) => {
          this.categoryList = [];
          for (const c0 of Object.keys(state)) {
            this.categoryList.push({slug: c0, label: state[c0]});
          }
        },
        error: (error) => {
          this.message(error, 'error');
        }
      })

    this.languageListSubscription = this._langIndexContract
      .getState(this._arweave.arweave)
      .subscribe({
        next: (state) => {
          this.languageList = [];
          for (const l0 of Object.keys(state)) {
            this.languageList.push({code: l0, label: state[l0].native_name});
          }
        },
        error: (error) => {
          this.message(error, 'error');
        }
      })


  }

  ngOnDestroy() {
    if (this.categoryListSubscription) {
      this.categoryListSubscription.unsubscribe();
    }
    if (this.languageListSubscription) {
      this.languageListSubscription.unsubscribe();
    }
  }


  getDefaultTheme() {
  	this.defaultTheme = this._userSettings.getDefaultTheme();
    this._userSettings.defaultThemeObservable$.subscribe(
    	(theme) => {
    		this.defaultTheme = theme;
    	}
    );
  }


  getSkeletonLoaderAnimationType() {
  	let type = 'false';
  	if (this.defaultTheme === 'arwiki-dark') {
  		// type = 'progress-dark';
  	}
  	return type;
  }

  getSkeletonLoaderThemeNgStyle() {
  	let ngStyle: any = {
  		'height.px': '320',
  		'width': '100%'
  	};
  	if (this.defaultTheme === 'arwiki-dark') {
  		ngStyle['background-color'] = '#3d3d3d';
  	}

  	return ngStyle;
  }

  /*
  *  @dev 
  */
  openFileManager() {
    const refFileManager = this._dialog.open(ModalFileManagerComponent, {
      width: '720px',
      data: {}
    });
    refFileManager.afterClosed().subscribe(result => {
      if (result) {
        this.previewImage(result);
      }
    });
  }

  onSubmit() {
  	const title = this.title!.value;
  	const slug = this.slug!.value;
  	const category = this.category!.value;
    const content = this.contentTextareaObject.value;

    if (!content) {
      alert('Please type some content :)');
      return;
    }
  	this.disableForm(true);

  	// Save data 

  	
  }

  disableForm(disable: boolean) {
  	if (disable) {
  		this.title!.disable();
	  	this.slug!.disable();
	  	this.category!.disable();
      this.language!.disable();
      this.loadingFrm = true;
  	} else {
  		this.title!.enable();
	  	this.slug!.enable();
	  	this.category!.enable();
      this.language!.enable();
      this.loadingFrm = false;
  	}
  }

  /*
  *  Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
  }

  previewImage(imgUrl: string) {
    if (imgUrl.length > 0) {
      this.previewImgUrl = `${this.baseImgUrl + imgUrl}`;
    }

  }

  updateSlug(s: string) {
    this.slug!.setValue(s.replace(/ /gi, '_'));
  }


}
