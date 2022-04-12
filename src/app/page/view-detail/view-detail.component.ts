import { 
  Component, OnInit, OnDestroy, 
  ChangeDetectorRef, ViewChild, ElementRef
} from '@angular/core';
import { ArwikiQuery } from '../../core/arwiki-query';
import * as marked from 'marked';
import DOMPurify from 'dompurify';
import { Observable, Subscription, of} from 'rxjs';
import { 
	readContract
} from 'smartweave';
import { ArweaveService } from '../../core/arweave.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token';
import { UserSettingsService } from '../../core/user-settings.service';
import { AuthService } from '../../auth/auth.service';
import { switchMap } from 'rxjs/operators';
declare const window: any;
declare const document: any;
import { DialogDonateComponent } from '../../shared/dialog-donate/dialog-donate.component';
import { DialogVotePageComponent } from '../../shared/dialog-vote-page/dialog-vote-page.component';
import { Direction } from '@angular/cdk/bidi';
import {MatDialog} from '@angular/material/dialog';
import { DialogConfirmComponent } from '../../shared/dialog-confirm/dialog-confirm.component';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import { BottomSheetShareComponent } from '../../shared/bottom-sheet-share/bottom-sheet-share.component';
import { DialogConfirmAmountComponent } from '../../shared/dialog-confirm-amount/dialog-confirm-amount.component';
import { arwikiVersion } from '../../core/arwiki';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';
import Prism from 'prismjs';
import 'prismjs/components/prism-graphql';

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
  loadingUpdateSponsorPage: boolean = false;
  loadingStopStake: boolean = false;
  loadingTags: boolean = false;
  tags: any[] = [];
  tagsSubscription: Subscription = Subscription.EMPTY;

  constructor(
    private route: ActivatedRoute,
    private _router: Router,
  	private _arweave: ArweaveService,
  	private _snackBar: MatSnackBar,
    private _location: Location,
    private _arwikiTokenContract: ArwikiTokenContract,
    private _userSettings: UserSettingsService,
    private _ref: ChangeDetectorRef,
    private _auth: AuthService,
    public _dialog: MatDialog,
    private _bottomSheetShare: MatBottomSheet
  ) { }

 

  ngOnInit(): void {
    Prism.manual = true;

  	this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);

    //const tmpPageData: ArwikiPage = this.route.snapshot.data[0];
    //this.updateMetaTags(tmpPageData);

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
      this.message(`${error}`, 'error');
      return;
    }
   

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
            title: this.removeHTMLfromStr(title),
            slug: this.removeHTMLfromStr(slug),
            category: this.removeHTMLfromStr(category),
            img: this.removeHTMLfromStr(img),
            owner: owner,
            id: id,
            block: block,
            upvotes: extraMetadata.upvotes,
            downvotes: extraMetadata.downvotes
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
          this.pageData.upvotes = page.upvotes ? page.upvotes : 0;
          this.pageData.downvotes = page.downvotes ? page.downvotes : 0;
          this.pageData.slug = page.slug ? page.slug : '';
          this.block = page.block;

          let content = await this._arweave.getTxContent(page.id);
          
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
            Prism.highlightAll();

          }, 500);

          // Load tags 
          this.loadingTags = true;
          this.tagsSubscription = this.searchTagsBySlug(
            this.pageData.slug, langCode, maxHeight
          ).subscribe({
            next: (res) => {
              for (let p of res) {
                const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
                const tag = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Tag');
                const owner = pTX.owner.address;
                const id = pTX.id;
                const block = pTX.block;
                this.tags.push(tag);
              }
              this.loadingTags = false;

            },
            error: (error) => {
              this.message(`${error}`, 'error');
              this.loadingTags = false;
            }
          });

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
    if (this.tagsSubscription) {
      this.tagsSubscription.unsubscribe();
    }
  }

  markdownToHTML(_markdown: string) {
  	var html = marked(_markdown);
		var clean = DOMPurify.sanitize(html);
		return clean;
  }

  removeHTMLfromStr(_html: string) {
    return DOMPurify.sanitize(_html, {ALLOWED_TAGS: []});
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
        top: elements[i].offsetTop - elements[i].scrollTop,
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

  donate(_author: string, _sponsor: string) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogDonateComponent, {
      data: {
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
      this.dialogLoginFirst();
      return;
    }
    this._router.navigate([_langCode, _slug, 'edit']); 
  }

  dialogLoginFirst() {
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
  }

  share() {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';
    const tmpContent = this.removeHTMLfromStr(this.pageData.content!);
    const limit = tmpContent.indexOf('.') > 0 ? tmpContent.indexOf('.') + 1 : 100;

    this._bottomSheetShare.open(BottomSheetShareComponent, {
      data: {
        title: this.removeHTMLfromStr(this.pageData.title),
        content: this.removeHTMLfromStr(`${tmpContent}`.substr(0, limit)),
        img: this.removeHTMLfromStr(`${this.baseURL + this.pageData.img}`)
      },
      direction: direction,
      ariaLabel: 'Share on social media'
    });

  }

  updateSocialMediaOGTags(title: string, content: string, img: string) {
    content = this.removeHTMLfromStr(content);
    const limit = content!.indexOf('.') > 0 ? content!.indexOf('.') + 1 : 100;
    const c2 = this.removeHTMLfromStr(`${content}`.substr(0, limit));
    const t2 = this.removeHTMLfromStr(title);
    const img2 = this.removeHTMLfromStr(`${this.baseURL + img}`);
    document.getElementById('META_OG_TITLE').content = t2;
    document.getElementById('META_OG_DESCRIPTION').content = c2;
    document.getElementById('META_OG_IMAGE').content = img2;

  }


  confirmSponsorArWikiPage(
    _slug: string,
    _category_slug: string,
    _pageValue: number,
  ) {
    if (!this.mainAddress) {
      this.dialogLoginFirst();
      return;
    }

    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogConfirmAmountComponent, {
      data: {
        title: 'Are you sure?',
        content: `You are about to be the new sponsor for this arwiki page. Do you want to proceed?`,
        pageValue: _pageValue + 1,
        second_content: 'Please define the amount of $WIKI tokens to stake:'
      },
      direction: direction,
      disableClose: true
    });

    dialogRef.afterClosed().pipe(
        switchMap((_newPageValue) => {
          const newPageValue = +_newPageValue;
          if (Number.isInteger(newPageValue) && newPageValue > 0) {
            this.loadingUpdateSponsorPage = true;
            return this._arwikiTokenContract.updatePageSponsor(
              _slug,
              _category_slug,
              this.routeLang,
              newPageValue,
              this._auth.getPrivateKey(),
              arwikiVersion[0],
            ); 
          } else if (newPageValue === 0) {
            throw Error('Stake must be greater than 0 $WIKI tokens');
          }
          return of(null);
        })
      ).subscribe({
        next: (tx) => {
          if (tx) {
            this.message(`Success ${tx}`, 'success');
          }
          this.loadingUpdateSponsorPage = false;

        },
        error: (error) => {
          this.message(`${error}`, 'error');
          this.loadingUpdateSponsorPage = false;
        }
      });
  }

  confirmStopStake(
    _slug: string
  ) {
    if (!this.mainAddress) {
      this.dialogLoginFirst();
      return;
    }

    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogConfirmComponent, {
      data: {
        title: 'Are you sure?',
        content: 'You are about to stop your stake and sponsorship for this page. This will unlist the page. Do you want to proceed?'
      },
      direction: direction,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        // Create "delete" tx
        this.loadingStopStake = true;
        try {
          const tx = await this._arwikiTokenContract.stopStaking(
            _slug,
            this.routeLang,
            this._auth.getPrivateKey(),
            arwikiVersion[0]
          ); 

          this.message('Success!', 'success');
          this.loadingStopStake = false;
        } catch (error) {
          this.message(`${error}`, 'error');
          this.loadingStopStake = false;
        }

      }
    });
  }

  upvote(upvote: boolean, sponsor: string, slug: string, lang: string) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogVotePageComponent, {
      data: {
        sponsor: sponsor,
        mainAddress: this.mainAddress,
        upvote: upvote,
        slug: slug,
        langCode: lang
      },
      direction: direction,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async (result) => {
    });
  }

  /*
  * @dev
  */
  searchTagsBySlug(
    _slug: string,
    _langCode: string,
    _maxHeight: number,
    _limit: number = 30
  ) {
    return this._arwikiTokenContract.getAdminList()
      .pipe(
        switchMap((_adminList: string[]) => {
          return this.arwikiQuery.getVerifiedTagsFromSlug(_adminList, _slug, _langCode, _limit, _maxHeight);
        }),
        switchMap((verifiedTags) => {
          const verifiedTagsTxList: string[] = [];
          for (const t of verifiedTags) {
            verifiedTagsTxList.push(t.id);
          }

          return this.arwikiQuery.getTXsData(verifiedTagsTxList);
        })
      );
  }

}
