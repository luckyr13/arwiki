import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { UserSettingsService } from '../../core/user-settings.service';
import { ArweaveService } from '../../core/arweave.service';
import { MatDialog } from '@angular/material/dialog';
import {
  ModalFileManagerComponent 
} from '../../shared/modal-file-manager/modal-file-manager.component';
import { FormGroup, FormControl } from '@angular/forms';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs'; 
import { ArwikiCategoriesContract } from '../../arwiki-contracts/arwiki-categories';
import { ArwikiLangIndexContract } from '../../arwiki-contracts/arwiki-lang-index';
import { ArwikiSettingsContract } from '../../arwiki-contracts/arwiki-settings';
import { ActivatedRoute } from '@angular/router';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ArwikiLangIndex } from '../../core/interfaces/arwiki-lang-index';
import { ArwikiLang } from '../../core/interfaces/arwiki-lang';
import * as SimpleMDE from 'simplemde';
declare const document: any;
declare const window: any;

@Component({
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss']
})
export class NewComponent implements OnInit, OnDestroy {
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
  previewImgUrlTX: string = '';
  
  simplemde: any;
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  baseImgUrl: string = this._arweave.baseURL;
  categoryList: any[] = [];
  languageList: ArwikiLang[] = [];
  categoryListSubscription: Subscription = Subscription.EMPTY;
  languageListSubscription: Subscription = Subscription.EMPTY;
  newPageTX: string = '';
  routeLang: string = '';
  arwikiQuery: ArwikiQuery|null = null;
  verifySlugSubscription: Subscription = Subscription.EMPTY;

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
    private _categoriesContract: ArwikiCategoriesContract,
    private _settingsContract: ArwikiSettingsContract,
    private _route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
  	this.getDefaultTheme();
    // Load markdown editor
    window.setTimeout(() => {
      this.simplemde = new SimpleMDE({
        element: document.getElementById("create-page-textarea-simplemde-content")
      });
    }, 500);
    

    this.categoryListSubscription = this._categoriesContract
      .getState()
      .subscribe({
        next: (state) => {
          this.categoryList = [];
          for (const c0 of Object.keys(state)) {
            this.categoryList.push({slug: c0, label: state[c0].label });
          }
        },
        error: (error) => {
          this.message(error, 'error');
        }
      })

    // DIsable title and slug while loading langs combo
    this.title!.disable();
    this.slug!.disable();
    this.languageListSubscription = this._langIndexContract
      .getState()
      .subscribe({
        next: (state: ArwikiLangIndex) => {
          this.languageList = [];
          for (const l0 of Object.keys(state)) {
            this.languageList.push(state[l0]);
          }
          this.language!.setValue(this.routeLang);
          this.title!.enable();
          this.slug!.enable();
    
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
    if (this.verifySlugSubscription) {
      this.verifySlugSubscription.unsubscribe();
    }
  }


  getDefaultTheme() {
  	this.defaultTheme = this._userSettings.getDefaultTheme();
    this._userSettings.defaultThemeStream.subscribe(
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
        this.setPreviewImage(result);
      }
    });
  }

  async onSubmit() {
  	const title = this.title!.value;
  	const slug = this.slug!.value;
  	const category = this.category!.value;
    const langCode = this.language!.value;
    const content = this.simplemde.value();
    const img = this.previewImgUrlTX;

    if (!content) {
      this.message('Please add some content to your page :)', 'error');
      return;
    }
    
  	this.disableForm(true);

    const target = '';
    const fee = '';

  	// Save data 
    try {
      const ticker = `ARWIKIP_${slug}`;
      const txid = await this._arweave.createNFTFromTX(
        title,
        ticker,
        'ArWiki page',
        1,
        this._auth.getMainAddressSnapshot(),
        this._auth.getPrivateKey(),
        content,
        'text/plain', 
        target,
        fee,
        langCode,
        category,
        slug,
        img
      );

      this.message(txid, 'success');
      this.newPageTX = txid;
      window.setTimeout(() => {
        const lastRoute = `/${this.routeLang}/dashboard`;
        this._router.navigate([lastRoute]);
      }, 20000);

    } catch (error) {
      this.message(error, 'error');
      this.disableForm(false);
    }


  	
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

  setPreviewImage(imgUrl: string) {
    if (imgUrl.length > 0) {
      this.previewImgUrlTX = imgUrl;
      this.previewImgUrl = `${this.baseImgUrl + imgUrl}`;
    }

  }

  updateSlug(s: string) {
    this.slug!.setValue(s.replace(/ /gi, '_'));
    this.verifySlug(this.slug!.value);
  }

  async verifySlug(_slug: string) {
    const _langCode = this.language!.value;
    this.slug!.disable();
    let networkInfo;
    let maxHeight = 0;
    try {
      networkInfo = await this._arweave.arweave.network.getInfo();
      maxHeight = networkInfo.height;
    } catch (error) {
      this.message(error, 'error');
      this.slug!.setValue('');
      this.slug!.enable();
    }

    this.verifySlugSubscription = this.arwikiQuery!
      .isPageBySlugAlreadyTaken(
        _slug, _langCode,
        this._settingsContract,
        this._categoriesContract,
        maxHeight
      ).subscribe({
        next: (taken) => {
          // Slug already taken
          if (taken) {
            this.message(`Slug already taken! Please try another one`, 'error');
            this.slug!.setValue('');
          } else {
            this.message('Slug available!', 'success');
          }

          this.slug!.enable();
        },
        error: (error) => {

          this.message(error, 'error');
          this.slug!.setValue('');
          this.slug!.enable();
        }
      });
  }

  clearSlug() {
    this.slug!.setValue('');
  }

  
  /*
  *  @dev
  */
  winstonToAr(_v: string) {
    return this._arweave.winstonToAr(_v);
  }

  /*
  *  @dev
  */
  arToWinston(_v: string) {
    return this._arweave.arToWinston(_v);
  }


}
