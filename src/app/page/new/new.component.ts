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
import { Subscription, of } from 'rxjs'; 
import { switchMap } from 'rxjs/operators';
import { ArwikiCategoriesContract } from '../../core/arwiki-contracts/arwiki-categories';
import { ArwikiLangIndexContract } from '../../core/arwiki-contracts/arwiki-lang-index';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token';
import { ActivatedRoute } from '@angular/router';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ArwikiLangIndex } from '../../core/interfaces/arwiki-lang-index';
import { ArwikiLang } from '../../core/interfaces/arwiki-lang';
import * as SimpleMDE from 'simplemde';
import { ArwikiCategory } from '../../core/interfaces/arwiki-category';
import { ArwikiCategoryIndex } from '../../core/interfaces/arwiki-category-index';
import { Direction } from '@angular/cdk/bidi';
import { Arwiki } from '../../core/arwiki';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
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
    language: new FormControl('', [Validators.required]),
    pageValue: new FormControl(0)
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
  categoryList: ArwikiCategory[] = [];
  languageList: ArwikiLang[] = [];
  categoryListSubscription: Subscription = Subscription.EMPTY;
  languageListSubscription: Subscription = Subscription.EMPTY;
  newPageTX: string = '';
  routeLang: string = '';
  arwikiQuery!: ArwikiQuery;
  verifySlugSubscription: Subscription = Subscription.EMPTY;
  private arwiki!: Arwiki;
  private _redirectTimeout: any = null;

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
  public get pageValue() {
    return this.frmNew.get('pageValue');
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
    private _arwikiTokenContract: ArwikiTokenContract,
    private _route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    this.arwiki = new Arwiki(this._arweave.arweave);
  	this.getDefaultTheme();
    // Load markdown editor
    this._redirectTimeout = window.setTimeout(() => {
      this.simplemde = new SimpleMDE({
        element: document.getElementById("create-page-textarea-simplemde-content")
      });
    }, 500);
    

    this.categoryListSubscription = this._categoriesContract
      .getState()
      .subscribe({
        next: (state: ArwikiCategoryIndex) => {
          this.categoryList = [];
          for (const c0 of Object.keys(state)) {
            if (state[c0].active) {
              this.categoryList.push(state[c0]);
            }
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
            if (state[l0].active) {
              this.languageList.push(state[l0]);
            }
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
    if (this._redirectTimeout) {
      window.clearTimeout(this._redirectTimeout);
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
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const refFileManager = this._dialog.open(ModalFileManagerComponent, {
      width: '720px',
      data: {},
      direction: direction
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
    const pageValue = this.pageValue!.value;

    if (!content) {
      this.message('Please add some content to your page :)', 'error');
      return;
    }
    
  	this.disableForm(true);

    const target = '';
    const fee = '';

  	// Save data 
    try {
      const newPage: ArwikiPage = {
          id: '',
          title: title,
          slug: slug,
          category: category,
          language: langCode,
          value: pageValue,
          img: img,
          owner: this._auth.getMainAddressSnapshot(),
          content: content
      };
      const txid = await this.arwiki.createNewArwikiPageTX(
        newPage,
        this._auth.getPrivateKey()
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
      this.pageValue!.disable();
	  	this.category!.disable();
      this.language!.disable();
      this.loadingFrm = true;
  	} else {
  		this.title!.enable();
	  	this.slug!.enable();
	  	this.category!.enable();
      this.language!.enable();
      this.pageValue!.enable();
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
    this.slug!.setValue(s.replace(/ /gi, '-'));
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

    this.verifySlugSubscription = this.isPageBySlugAlreadyTaken(
        _slug, _langCode, maxHeight
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

  /*
  * @dev
  */
  isPageBySlugAlreadyTaken(
    _slug: string,
    _langCode: string,
    _maxHeight: number,
    _limit: number = 20
  ) {
    let categoriesCS: any = {};

    let adminList: string[] = [];
    let stakingPages: any = {};

    const verifiedPagesDict: Record<string,boolean> = {};
    return this._arwikiTokenContract.getApprovedPages(_langCode, -1)
      .pipe(
        switchMap((approvedPages) => {
          return of(!!approvedPages[_slug]);
        }),

      );
  }

  formatLabel(value: number) {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }

    return value;
  }


}
