import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { UserSettingsService } from '../../core/user-settings.service';
import { ArweaveService } from '../../core/arweave.service';
import { MatDialog } from '@angular/material/dialog';
import {
  FileManagerDialogComponent 
} from '../../shared/file-manager-dialog/file-manager-dialog.component';
import {
  UploadFileDialogComponent 
} from '../../shared/upload-file-dialog/upload-file-dialog.component';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UtilsService } from '../../core/utils.service';
import { Subscription, of, from } from 'rxjs'; 
import { switchMap } from 'rxjs/operators';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';
import { ActivatedRoute } from '@angular/router';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ArwikiLangIndex } from '../../core/interfaces/arwiki-lang-index';
import { ArwikiLang } from '../../core/interfaces/arwiki-lang';
import * as SimpleMDE from 'simplemde';
import { ArwikiCategory } from '../../core/interfaces/arwiki-category';
import { ArwikiCategoryIndex } from '../../core/interfaces/arwiki-category-index';
import { Direction } from '@angular/cdk/bidi';
import { Arwiki, arwikiVersion } from '../../core/arwiki';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
declare const document: any;
declare const window: any;
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { EmojisComponent } from '../../shared/emojis/emojis.component';
import { DialogCompareComponent } from '../../shared/dialog-compare/dialog-compare.component';
import { ArwikiLangsService } from '../../core/arwiki-contracts/arwiki-langs.service';
import { ArwikiCategoriesService } from '../../core/arwiki-contracts/arwiki-categories.service';
import { ArwikiPagesService } from '../../core/arwiki-contracts/arwiki-pages.service';
import {
  DialogLoadFromTxComponent 
} from '../../shared/dialog-load-from-tx/dialog-load-from-tx.component';
import { ArwikiMenuService } from '../../core/arwiki-contracts/arwiki-menu.service';

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
    pageId: new UntypedFormControl('', [Validators.required, Validators.maxLength(50)]),
    useDispatch: new UntypedFormControl(false)
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
    img: '',
  };
  pageExtraMetadata: any = {};
  block: any;
  pageNotFound: boolean = false;
  overlayRef: OverlayRef|null = null;
  emojisPortal: ComponentPortal<EmojisComponent>|null = null;
  savingPageSubscription = Subscription.EMPTY;

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
  public get useDispatch() {
    return this.frmNew.get('useDispatch')!;
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
  	private _utils: UtilsService,
    private _arwikiTokenContract: ArwikiTokenContract,
    private _route: ActivatedRoute,
    private _overlay: Overlay,
    private _arwikiTokenLangsContract: ArwikiLangsService,
    private _arwikiCategories: ArwikiCategoriesService,
    private _arwikiPages: ArwikiPagesService,
    private _arwikiMenu: ArwikiMenuService
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
    
    this._loadCategories();
    
    // DIsable title and slug while loading langs combo
    this.title!.disable();
    this.languageListSubscription = this._arwikiTokenLangsContract
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
          this._utils.message(error, 'error');
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
    this.savingPageSubscription.unsubscribe();
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

  async onSubmit() {
  	const title = this.title!.value;
  	const slug = this.slug!.value;
  	const category = this.category!.value;
    const langCode = this.language!.value;
    const content = this.simplemde.value();
    const img = this.previewImgUrlTX;
    const pageValue = this.pageValue!.value;

    if (!content) {
      this._utils.message('Please add some content to your page :)', 'error');
      return;
    }
    
  	this.disableForm(true);

    const target = '';
    const fee = '';

  	// Save data 
    const newPage: ArwikiPage = {
        id: '',
        title: title,
        slug: slug,
        category: category,
        language: langCode,
        value: pageValue,
        img: img,
        rawContent: content
    };

    const disableDispatch = !this.useDispatch!.value;
    this.savingPageSubscription = this.updatePage(newPage, disableDispatch).subscribe({
      next: (tx) => {
        const txid = tx.id;
        this._utils.message(txid, 'success');
        this.newPageTX = txid;
        this._redirectTimeout = window.setTimeout(() => {
          const lastRoute = `/${this.routeLang}/dashboard`;
          this._router.navigate([lastRoute]);
        }, 20000);
      },
      error: (error) => {
        this._utils.message(`${error}`, 'error');
        this.disableForm(false);
      }
    });

  	
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

  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }

    return `${value}`;
  }

  loadPageData(slug: string, langCode: string) {
     // Init page data 
    this.pageData.title = '';
    this.pageData.img = '';
    this.pageData.id = '';
    this.pageData.rawContent = '';
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
          this.pageData.category = page.category ? page.category : '';
          this.block = page.block;
          this.pageData.slug = page.slug ? page.slug : '';

          let content = await this._arweave.getTxContent(page.id);
          this.pageData.rawContent = content;
          this.pageId.setValue(this.pageData.id);
          this.title.setValue(this.pageData.title);
          this.category.setValue(this.pageData.category);
          this.setPreviewImage(this.pageData.img!);
          // Load markdown editor
          window.setTimeout(() => {
            this.simplemde = new SimpleMDE({
              element: document.getElementById("create-page-textarea-simplemde-content"),
              initialValue: this.pageData.rawContent,
              toolbar: [
                "bold", "italic", "heading", "|",
                "quote", "unordered-list", "ordered-list", "strikethrough", "code", "|",
                "link", "image", 
                {
                  name: "emojis",
                  action: (editor) => {
                    this.openEmojiMenu(editor);
                  },
                  className: "fa fa-smile-o",
                  title: "Add emoji",
                },
                {
                  name: "diff-checker",
                  action: (editor) => {
                    this.compare(this.simplemde.value(), this.pageData.slug);
                  },
                  className: "fa fa-superpowers",
                  title: "Compare with original article",
                },
                "|",
                "preview", "side-by-side", "fullscreen",  "|", 
                "guide"
              ],
            });
          }, 500);

          this.loadingPageData = false;




        } else {
          this.pageData.rawContent = '';
          this.pageNotFound = true;
          this._utils.message('Page not found', 'error')
          this.loadingPageData = false;
        }


      },
      error: (error) => {
        this._utils.message(error, 'error')
        this.loadingPageData = false;
        this.pageData.rawContent = '';
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
    return this._arwikiPages.getApprovedPages(
        _langCode,
        -1
      ).pipe(
        switchMap((verifiedPages) => {
          const p = verifiedPages[_slug];
          this.pageExtraMetadata = verifiedPages[_slug];

          if (p && p.id) {
            verifiedPagesList.push(p.id);
          } else {
            throw Error('Page does not exist!');
          }

          return this.arwikiQuery.getTXsData(verifiedPagesList);
        })
      );
  }

  openEmojiMenu(editor: SimpleMDE) {
    const emojiMenu = document.getElementsByClassName('fa fa-smile-o')[0];
    if (!emojiMenu) {
      throw Error('EmojiMenu not available');
    }
    const positionStrategy = this._overlay.position().flexibleConnectedTo(emojiMenu).withPositions([
       {
         originX: 'end',
         originY: 'top',
         overlayX: 'center',
         overlayY: 'top',
         offsetY: 32
       }
     ]);

    this.overlayRef = this._overlay.create({
      hasBackdrop: true,
      disposeOnNavigation: true,
      scrollStrategy: this._overlay.scrollStrategies.close(),
      positionStrategy
    });

    this.emojisPortal = new ComponentPortal(EmojisComponent);
    this.overlayRef!.attach(this.emojisPortal);

    this.overlayRef.overlayElement.addEventListener('click', (event) => {
      const target = <HTMLElement>event.target;
      const emoji = target && target.classList.contains('emoji') ? target.innerHTML.trim() : '';
      const currentEditorValue = editor.codemirror.getValue();
      editor.codemirror.setValue(`${currentEditorValue}${emoji}`);
      this.closeEmojiMenu();
    });

    this.overlayRef!.backdropClick().subscribe(() => {
      this.closeEmojiMenu();
    });
    
  }


  closeEmojiMenu() {
    this.overlayRef!.dispose();
  }

  fileManager(type: string) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(
      FileManagerDialogComponent,
      {
        restoreFocus: false,
        autoFocus: false,
        disableClose: true,
        data: {
          type: type,
          address: this.authorAddress
        },
        direction: direction,
        width: '800px'
      });

    // Manually restore focus to the menu trigger
    dialogRef.afterClosed().subscribe((res: {id: string, type:'text'|'image'|'audio'|'video'|''}) => { 
      if (res) {
        this.setPreviewImage(res.id);
      }
    });
  }

  uploadFile(type: string) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(
      UploadFileDialogComponent,
      {
        restoreFocus: false,
        autoFocus: true,
        disableClose: true,
        data: {
          type: type,
          address: this.authorAddress
        },
        direction: direction,
        width: '800px'
      }
    );

    // Manually restore focus to the menu trigger
    dialogRef.afterClosed().subscribe((res: { id: string, type: 'text'|'image'|'audio'|'video'|'' }|null|undefined) => {
      if (res) {
        this.setPreviewImage(res.id);
      }
    });
  }

  updatePage(
    _newPage: ArwikiPage,
    _disableDispatch: boolean = true
  ) {
    const jwk = this._auth.getPrivateKey();
    const data = _newPage.rawContent;
    const loginMethod = this._auth.loginMethod;
    const tags: {name: string, value: string}[] = [
      { name: 'Service', value: 'ArWiki' },
      { name: 'Arwiki-Type', value: 'PageUpdate' },
      { name: 'Arwiki-Page-Id', value: _newPage.id },
      { name: 'Arwiki-Page-Slug', value: _newPage.slug },
      { name: 'Arwiki-Page-Category', value: _newPage.category },
      { name: 'Arwiki-Page-Title', value: _newPage.title },
      { name: 'Arwiki-Page-Img', value: _newPage.img! },
      { name: 'Arwiki-Page-Lang', value: _newPage.language },
      { name: 'Arwiki-Page-Value', value: _newPage.value!.toString() },
      { name: 'Arwiki-Version', value: arwikiVersion[0] },
    ];
    const contentType = 'text/plain';

    return this._arweave.uploadFileToArweave(
      data, contentType, jwk, tags,
      loginMethod, _disableDispatch
    );
  }

  compare(newPageContent: string, slug: string) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogCompareComponent, {
      data: {
        newPageContent,
        slug,
        lang: this.routeLang
      },
      direction: direction
    });

    dialogRef.afterClosed().subscribe({
      next: () => {
        
      },
      error: (error) => {
        this._utils.message(`${error}`, 'error');
      }
    });
  }

  resetImage() {
    this.previewImgUrlTX = '';
    this.previewImgUrl = '';
  }

  loadFromTx(type: string) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(
      DialogLoadFromTxComponent,
      {
        restoreFocus: false,
        autoFocus: false,
        disableClose: true,
        data: {
          type: type,
          address: this.authorAddress
        },
        direction: direction,
        width: '800px'
      });

    // Manually restore focus to the menu trigger
    dialogRef.afterClosed().subscribe((res: {tx: string, type:'text'|'image'|'audio'|'video'|'', content: string}) => { 
      if (res) {
        this.setPreviewImage(res.tx);
      }
    });
  }

  private _loadCategories() {
    const onlyActiveCategories = true;
    this.categoryList = [];
    this.categoryListSubscription = this._arwikiCategories
      .getCategories(this.routeLang, onlyActiveCategories)
      .subscribe({
        next: (categories: ArwikiCategoryIndex) => {
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

}
