import { 
  Component, OnInit, OnDestroy, 
  ChangeDetectorRef, ViewChild, ElementRef
} from '@angular/core';
import { ArwikiQuery } from '../../core/arwiki-query';
import * as marked from 'marked';
import DOMPurify from 'dompurify';
import { Observable, Subscription, of } from 'rxjs';
import { 
	readContract
} from 'smartweave';
import { ArweaveService } from '../../core/arweave.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token';
import { ArwikiCategoriesContract } from '../../core/arwiki-contracts/arwiki-categories';
import { UserSettingsService } from '../../core/user-settings.service';
import { AuthService } from '../../auth/auth.service';
import { switchMap } from 'rxjs/operators';
declare const window: any;
declare const document: any;
import gsap from 'gsap';
import { DialogDonateComponent } from '../../shared/dialog-donate/dialog-donate.component';
import { Direction } from '@angular/cdk/bidi';
import {MatDialog} from '@angular/material/dialog';
import { DialogConfirmComponent } from '../../shared/dialog-confirm/dialog-confirm.component';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';

@Component({
  templateUrl: './view-detail.component.html',
  styleUrls: ['./view-detail.component.scss']
})
export class ViewDetailComponent implements OnInit, OnDestroy {
	arwikiQuery!: ArwikiQuery;
	pageSubscription: Subscription = Subscription.EMPTY;
  loadingPage: boolean = false;
  block: any;
  scrollTop: number = 0;
  toc: any[] = [];
  routeLang: string = '';
  routeSlug: string = '';
  baseURL: string = this._arweave.baseURL;
  fragment: string = '';
  pageNotFound: boolean = false;
  isUserLoggedIn: boolean = false;
  @ViewChild('donateIcon1', {read: ElementRef}) donateIcon1!: ElementRef;
  @ViewChild('donateIcon2', {read: ElementRef}) donateIcon2!: ElementRef;
  mainAddress: string = '';
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

  constructor(
    private route: ActivatedRoute,
    private _router: Router,
  	private _arweave: ArweaveService,
  	private _snackBar: MatSnackBar,
    private _location: Location,
    private _arwikiTokenContract: ArwikiTokenContract,
    private _userSettings: UserSettingsService,
    private _ref: ChangeDetectorRef,
    private _categoriesContract: ArwikiCategoriesContract,
    private _auth: AuthService,
    public _dialog: MatDialog
  ) { }

  ngOnInit(): void {
  	this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);

    this.route.paramMap.subscribe(async params => {
      const slug = params.get('slug');
      const lang = params.get('lang');
      this.routeLang = lang!;
      this.routeSlug = slug!;
      if (slug) {
        await this.loadPageData(slug!, lang!);

      }
    });

    this._userSettings.scrollTopStream.subscribe((scroll) => {
      this.scrollTop = scroll;
      this._ref.detectChanges();
    })

    this.isUserLoggedIn = !!this._auth.getMainAddressSnapshot();
    this.mainAddress = this._auth.getMainAddressSnapshot();
    this._auth.account$.subscribe((_mainAddress) => {
      this.mainAddress = _mainAddress;
      this.isUserLoggedIn = !!_mainAddress;
    })

    

  }

  animateDonateIcon(_icon: ElementRef) {
    gsap.to(_icon.nativeElement,
      {
        ease: "elastic", 
        duration: 3, 
        repeat: -1, 
        repeatDelay: 3,
        rotationY: 360
    });
  }


  async loadPageData(slug: string, langCode: string) {
     // Init page data 
    this.pageData.title = '';
    this.pageData.img = '';
    this.pageData.id = '';
    this.pageData.content = '';
    this.pageData.owner = '';
    this.pageData.category = '';
    this.block = {};
    const numPages = 20;
  	this.loadingPage = true;

    let networkInfo;
    let maxHeight = 0;
    try {
      networkInfo = await this._arweave.arweave.network.getInfo();
      maxHeight = networkInfo.height;
    } catch (error) {
      this.message(error, 'error');
      return;
    }
   

  	this.pageSubscription = this.getPageBySlug(
  		slug, langCode, maxHeight, numPages
  	).subscribe({
  		next: async (data) => {
        const finalRes: any = [];
        for (let p of data) {
          const title = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Title');
          const slug = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug');
          const category = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Category');
          const img = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Img');
          const owner = p.node.owner.address;
          const id = p.node.id;
          const block = p.node.block;
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

          const content = await this._arweave.arweave.transactions.getData(
            page.id, 
            {decode: true, string: true}
          );
          this.pageData.content = this.markdownToHTML(content);

          this.loadingPage = false;

          // Generate TOC 
          window.setTimeout(() => {
            this.generateTOC();
            // Listen for fragments
            this.route.fragment.subscribe(fragment => {
              this.fragment = '';
              if (fragment) {
                this.fragment = fragment;
                this._userSettings.scrollTo(this.fragment, -80);
              }
            });
            // Animate icons
            this.animateDonateIcon(this.donateIcon1);
            this.animateDonateIcon(this.donateIcon2);
          }, 500);


  			} else {
          this.pageData.content = '';
          this.pageNotFound = true;
  				this.message('Page not found', 'error')
          this.loadingPage = false;
  			}


  		},
  		error: (error) => {
  			this.message(error, 'error')
        this.loadingPage = false;
        this.pageData.content = '';
        this.pageNotFound = true;
  		}
  	});

  }

  ngOnDestroy() {
  	if (this.pageSubscription) {
  		this.pageSubscription.unsubscribe();
  	}
  }

  markdownToHTML(_markdown: string) {
  	var html = marked(_markdown);
		var clean = DOMPurify.sanitize(html);
		return html;
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

  goBack() {
    this._location.back();
  }


  generateTOC() {
    this.toc = [];
    const container = document.getElementById('arwiki-page-content-detail');
    if (!container) {
      return;
    }
    const headers = container.querySelectorAll('h1, h2, h3, h4');
    this.generateTOC_helper_addId(headers);

  }

  generateTOC_helper_addId(elements: any[]) {
    const numElements = elements.length;
    for (let i = 0; i < numElements; i++) {
      const finalId = elements[i].innerText.trim().replace(/ /gi, '_');
      elements[i].id = `toc_${finalId}`;
      const menuElement = {
        id: elements[i].id,
        top: elements[i].getBoundingClientRect().top,
        text: elements[i].innerText,
        type: elements[i].tagName
      };
      this.generateTOC_helper_addToTable(menuElement);
    }

  }

  generateTOC_helper_addToTable(element: any) {
    this.toc.push(element);
  }

  validateTOCactiveMenu(_elementTop: number ){
    return (_elementTop < this.scrollTop + 170);
  }

  timestampToDate(_time: number) {
    let d = new Date(_time * 1000);
    return d;
  }

  /*
  * @dev
  */
  getPageBySlug(
    _slug: string,
    _langCode: string,
    _maxHeight: number,
    _limit: number = 20
  ) {
    let categoriesCS: any = {};
    let adminList: string[] = [];
    const verifiedPagesList: string[] = [];
    return this._categoriesContract.getState()
      .pipe(
        switchMap((categoriesContractState) => {
          categoriesCS = Object.keys(categoriesContractState);
          return this._arwikiTokenContract.getAdminList();
        }),
        switchMap((_adminList: string[]) => {
          adminList = _adminList;
          return this._arwikiTokenContract.getApprovedPages(
            _langCode,
            -1,
            true
          );
        }),
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

  donate(_author: string, _sponsor: string) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    // The sponsor always gets the donation :)
    _author = '';

    const dialogRef = this._dialog.open(DialogDonateComponent, {
      data: {
        author: _author,
        sponsor: _sponsor,
        mainAddress: this.mainAddress
      },
      direction: direction,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async (result) => {
    });
  }

  editPage(_slug: string, _langCode: string) {
    if (!this.mainAddress) {
      const defLang = this._userSettings.getDefaultLang();
      let direction: Direction = defLang.writing_system === 'LTR' ? 
        'ltr' : 'rtl';
      const dialogRef = this._dialog.open(DialogConfirmComponent, {
        data: {
          title: 'Please login first',
          content: 'You need to login first.',
          type: 'info'
        },
        direction: direction
      });

      return;
    }
    this._router.navigate([_langCode, _slug, 'edit']); 
  }

}
