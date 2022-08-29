import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { UserSettingsService } from '../../core/user-settings.service';
import { ArweaveService } from '../../core/arweave.service';
import { MatDialog } from '@angular/material/dialog';
import {
  ModalFileManagerComponent 
} from '../../shared/modal-file-manager/modal-file-manager.component';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription, of, from } from 'rxjs'; 
import { switchMap } from 'rxjs/operators';
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
import * as marked from 'marked';
import DOMPurify from 'dompurify';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';

@Component({
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss']
})
export class EditComponent implements OnInit, OnDestroy {
	public authorAddress: string = this._auth.getMainAddressSnapshot();
	defaultTheme: string = '';
	loadingFrm: boolean = false;
  loadingPageData: boolean = false;
	frmNew: UntypedFormGroup = new UntypedFormGroup({
		title: new UntypedFormControl('', [Validators.required, Validators.maxLength(150)]),
		slug: new UntypedFormControl('', [Validators.required, Validators.maxLength(150)]),
    category: new UntypedFormControl('', [Validators.required]),
    language: new UntypedFormControl('', [Validators.required]),
    pageValue: new UntypedFormControl(1),
    pageId: new UntypedFormControl('', [Validators.required, Validators.maxLength(50)])
	});
	txmessage: string = '';
  previewImgUrl: string = '';
  previewImgUrlTX: string = '';
  pageSubscription: Subscription = Subscription.EMPTY;
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
  routeSlug: string = '';
  arwikiQuery!: ArwikiQuery;
  verifySlugSubscription: Subscription = Subscription.EMPTY;
  pageDataSubscription: Subscription = Subscription.EMPTY;
  private arwiki!: Arwiki;
  private _redirectTimeout: any = null;
  pageData: ArwikiPage = {
    id: '',
    title: '',
    slug: '',
    category: '',
    language: '',
    owner: '',
    img: '',
  };
  pageExtraMetadata: any = {};
  block: any;
  pageNotFound: boolean = false;

  public get title() {
		return this.frmNew.get('title')!;
	}
	public get slug() {
		return this.frmNew.get('slug')!;
	}
	public get category() {
		return this.frmNew.get('category')!;
	}
  public get language() {
    return this.frmNew.get('language')!;
  }
  public get pageValue() {
    return this.frmNew.get('pageValue')!;
  }
  public get pageId() {
    return this.frmNew.get('pageId')!;
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
    private _arwikiTokenContract: ArwikiTokenContract,
    private _route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;
    this.routeSlug = this._route.snapshot.paramMap.get('slug')!;
    this.slug.disable();
    this.slug.setValue(this.routeSlug);
    this.pageId.disable();
    this.language.disable();
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    this.arwiki = new Arwiki(this._arweave.arweave);
  	this.getDefaultTheme();
    
    this.categoryListSubscription = this._arwikiTokenContract
      .getCategories()
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
    this.languageListSubscription = this._arwikiTokenContract
      .getLanguages()
      .subscribe({
        next: (state: ArwikiLangIndex) => {
          this.languageList = [];
          for (const l0 of Object.keys(state)) {
            if (state[l0].active && this.routeLang === state[l0].code) {
              this.languageList.push(state[l0]);
            }
          }
          this.language!.setValue(this.routeLang);
          this.title!.enable();
    
        },
        error: (error) => {
          this.message(error, 'error');
        }
      })

    this.loadPageData(this.routeSlug, this.routeLang);

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
    if (this.pageSubscription) {
      this.pageSubscription.unsubscribe();
    }
    if (this.pageDataSubscription) {
      this.pageDataSubscription.unsubscribe();
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
      const txid = await this.arwiki.createUpdateArwikiPageTX(
        newPage,
        this._auth.getPrivateKey()
      );
        
      this.message(txid, 'success');
      this.newPageTX = txid;
      this._redirectTimeout = window.setTimeout(() => {
        const lastRoute = `/${this.routeLang}/dashboard`;
        this._router.navigate([lastRoute]);
      }, 20000);

    } catch (error) {
      this.message(`${error}`, 'error');
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
	  	this.category!.enable();
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

  formatLabel(value: number) {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }

    return value;
  }

  loadPageData(slug: string, langCode: string) {
     // Init page data 
    this.pageData.title = '';
    this.pageData.img = '';
    this.pageData.id = '';
    this.pageData.content = '';
    this.pageData.owner = '';
    this.pageData.category = '';
    this.block = {};
    const numPages = 20;
    this.loadingPageData = true;

    this.pageSubscription = this.getPageBySlug(
      slug, langCode
    ).subscribe({
      next: async (data: ArdbTransaction[]|ArdbBlock[]) => {
        const finalRes: any = [];
        for (let p of data) {
          const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
          const title = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
          const slug = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug');
          const category = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category');
          const img = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img');
          const owner = pTX.owner.address;
          const id = pTX.id;
          const block = pTX.block;
          const extraMetadata = this.pageExtraMetadata;

          
          finalRes.push({
            title: title,
            slug: slug,
            category: category,
            img: img,
            owner: owner,
            id: id,
            block: block
          });
          
        }

        // If page exists
        if (finalRes.length > 0) {
          const page: any = finalRes[0];
          this.pageData.title = page.title ? page.title : '';
          this.pageData.img = page.img ? page.img : '';
          this.pageData.id = page.id ? page.id : '';
          this.pageData.owner = page.owner ? page.owner : '';
          this.pageData.category = page.category ? page.category : '';
          this.block = page.block;

          let content = await this._arweave.getTxContent(page.id);
          this.pageData.content = content;
          this.pageId.setValue(this.pageData.id);
          this.title.setValue(this.pageData.title);
          this.category.setValue(this.pageData.category);
          this.setPreviewImage(this.pageData.img!);
          // Load markdown editor
          window.setTimeout(() => {
            this.simplemde = new SimpleMDE({
              element: document.getElementById("create-page-textarea-simplemde-content"),
              initialValue: this.pageData.content
            });
          }, 500);

          this.loadingPageData = false;




        } else {
          this.pageData.content = '';
          this.pageNotFound = true;
          this.message('Page not found', 'error')
          this.loadingPageData = false;
        }


      },
      error: (error) => {
        this.message(error, 'error')
        this.loadingPageData = false;
        this.pageData.content = '';
        this.pageNotFound = true;
      }
    });

  }

  /*
  * @dev
  */
  getPageBySlug(
    _slug: string,
    _langCode: string
  ) {
    const verifiedPagesList: string[] = [];
    return this._arwikiTokenContract.getApprovedPages(
        _langCode,
        -1,
        true
      ).pipe(
        switchMap((verifiedPages) => {
          const p = verifiedPages[_slug];
          this.pageExtraMetadata = verifiedPages[_slug];

          if (p && p.content) {
            verifiedPagesList.push(p.content);
          } else {
            throw Error('Page does not exist!');
          }

          return this.arwikiQuery.getTXsData(verifiedPagesList);
        })
      );
  }

}
