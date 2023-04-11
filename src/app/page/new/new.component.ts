import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
import { Subscription, of, Observable } from 'rxjs'; 
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
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { EmojisComponent } from '../../shared/emojis/emojis.component';
import { ArwikiLangsService } from '../../core/arwiki-contracts/arwiki-langs.service';
import { ArwikiPagesService } from '../../core/arwiki-contracts/arwiki-pages.service';
import { ArwikiMenuService } from '../../core/arwiki-contracts/arwiki-menu.service';

@Component({
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss']
})
export class NewComponent implements OnInit, OnDestroy, AfterViewInit {
	public authorAddress: string = this._auth.getMainAddressSnapshot();
	defaultTheme: string = '';
	loadingFrm: boolean = false;
	frmNew: UntypedFormGroup = new UntypedFormGroup({
		title: new UntypedFormControl('', [Validators.required, Validators.maxLength(150)]),
		slug: new UntypedFormControl('', [Validators.required, Validators.maxLength(150)]),
    category: new UntypedFormControl('', [Validators.required]),
    language: new UntypedFormControl('', [Validators.required]),
    pageValue: new UntypedFormControl(1),
    useDispatch: new UntypedFormControl(false)
	});
	txmessage: string = '';
  previewImgUrl: string = '';
  previewImgUrlTX: string = '';
  simplemde: SimpleMDE|null = null;
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
  savingPageSubscription = Subscription.EMPTY;

  emojisPortal: ComponentPortal<EmojisComponent>|null = null;
  overlayRef: OverlayRef|null = null;
  loadEditorSubscription: Subscription = Subscription.EMPTY;
  @ViewChild('frmTextareaEditor') frmTextareaEditor!: ElementRef;

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
  public get useDispatch() {
    return this.frmNew.get('useDispatch');
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
    private _arwikiPages: ArwikiPagesService,
    private _arwikiMenu: ArwikiMenuService
  ) { }

  ngOnInit(): void {
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    this.arwiki = new Arwiki(this._arweave.arweave);
  	this.getDefaultTheme();
    // Load and fill form fields
    this.loadCategories();
    this.loadLangsCombo();

  }

  ngOnDestroy() {
    this.categoryListSubscription.unsubscribe();
    this.languageListSubscription.unsubscribe();
    this.savingPageSubscription.unsubscribe();
    this.verifySlugSubscription.unsubscribe();
    if (this._redirectTimeout) {
      window.clearTimeout(this._redirectTimeout);
    }
    this.loadEditorSubscription.unsubscribe();
    if (this.simplemde) {
      this.simplemde.toTextArea();
      this.simplemde = null;
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

  async onSubmit() {
  	const title = this.title!.value;
  	const slug = this.slug!.value;
  	const category = this.category!.value;
    const langCode = this.language!.value;
    const content = this.simplemde!.value();
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
    this.savingPageSubscription = this.savePage(newPage, disableDispatch).subscribe({
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
      this.useDispatch!.disable();
  	} else {
  		this.title!.enable();
	  	this.slug!.enable();
	  	this.category!.enable();
      this.language!.enable();
      this.pageValue!.enable();
      this.loadingFrm = false;
      this.useDispatch!.enable();
  	}
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
      this._utils.message(`${error}`, 'error');
      this.slug!.setValue('');
      this.slug!.enable();
    }

    this.verifySlugSubscription = this.isPageBySlugAlreadyTaken(
        _slug, _langCode, maxHeight
      ).subscribe({
        next: (taken) => {
          // Slug already taken
          if (taken) {
            this._utils.message(`Slug already taken! Please try another one`, 'error');
            this.slug!.setValue('');
          } else {
            this._utils.message('Slug available!', 'success');
          }

          this.slug!.enable();
        },
        error: (error) => {
          this._utils.message(error, 'error');
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
    return this._arwikiPages.getApprovedPages(_langCode, -1)
      .pipe(
        switchMap((approvedPages) => {
          return of(!!approvedPages[_slug]);
        }),

      );
  }

  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }

    return `${value}`;
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

  ngAfterViewInit() {
    // Load markdown editor
    const obs = new Observable((subscriber) => {
      window.setTimeout(() => {
        try {
          console.log('native', this.frmTextareaEditor, this.frmTextareaEditor.nativeElement)
          this.simplemde = new SimpleMDE({
            element: this.frmTextareaEditor.nativeElement,
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
              "|",
              "preview", "side-by-side", "fullscreen",  "|", 
              "guide"
            ],
          });
          subscriber.next(true);
          subscriber.complete();
        } catch (error) {
          console.log('Error loading editor: ', error);
          subscriber.error(error);
        }
      }, 500)
    })

    this.loadEditorSubscription = obs.subscribe((res) => {
      // Done
    });
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

  savePage(
    _newPage: ArwikiPage,
    _disableDispatch: boolean = true
  ) {
    const jwk = this._auth.getPrivateKey();
    const data = _newPage.rawContent;
    const loginMethod = this._auth.loginMethod;
    const tags: {name: string, value: string}[] = [
      { name: 'Service', value: 'ArWiki' },
      { name: 'Arwiki-Type', value: 'Page' },
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
      data, 'text/plain', jwk, tags,
      loginMethod, _disableDispatch
    );
  }

  loadLangsCombo() {
    // DIsable title and slug while loading langs combo
    this.title!.disable();
    this.slug!.disable();
    const onlyActive = true;
    this.languageListSubscription = this._arwikiTokenLangsContract
      .getLanguages(onlyActive)
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
          this._utils.message(error, 'error');
        }
      });
  }

  loadCategories(reload: boolean = false) {
    const langCode = this.routeLang;
    const onlyActiveCategories = true;
    this.categoryListSubscription = this._arwikiMenu.getMainMenuOnlyCategories(
      this.routeLang,
      onlyActiveCategories
    ).subscribe({
      next: (data) => {
        const categories = data.categories;
        
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
