import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArweaveService } from '../../core/arweave.service';
import { Observable, Subscription, EMPTY, of, from } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { UtilsService } from '../../core/utils.service';
import { switchMap } from 'rxjs/operators';
import {MatDialog} from '@angular/material/dialog';
import { DialogConfirmComponent } from '../../shared/dialog-confirm/dialog-confirm.component';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ActivatedRoute } from '@angular/router';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { ArwikiCategoryIndex } from '../../core/interfaces/arwiki-category-index';
import { ArwikiPageIndex } from '../../core/interfaces/arwiki-page-index';
import { Direction } from '@angular/cdk/bidi';
import { UserSettingsService } from '../../core/user-settings.service';
import { Arwiki } from '../../core/arwiki';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';
import { arwikiVersion } from '../../core/arwiki';
import { DialogConfirmAmountComponent } from '../../shared/dialog-confirm-amount/dialog-confirm-amount.component';
import { DialogSearchPageUpdateComponent } from '../dialog-search-page-update/dialog-search-page-update.component';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';
import { ArwikiCategoriesService } from '../../core/arwiki-contracts/arwiki-categories.service';
import { ArwikiPagesService } from '../../core/arwiki-contracts/arwiki-pages.service';

@Component({
  templateUrl: './approved-list.component.html',
  styleUrls: ['./approved-list.component.scss']
})
export class ApprovedListComponent implements OnInit, OnDestroy {
  loadingApprovedPages: boolean = false;
  pages: ArwikiPage[] = [];
  approvedPagesSubscription: Subscription = Subscription.EMPTY;
  arwikiQuery!: ArwikiQuery;
  routeLang: string = '';
  loadingDeletePage: boolean = false;
  deleteTxMessage: string = '';
  stopStakeTxMessage: string = '';
  loadingStopStake: boolean = false;
  loadingSetMainPage: boolean = false;
  setMainTxMessage: string = '';
  private _arwiki!: Arwiki;
  myAddress: string = '';
  currentBlockHeight: number = 0;
  heightSubscription: Subscription = Subscription.EMPTY;
  baseURL = this._arweave.baseURL;
  updateSponsorPageTxMessage: string = '';
  updateSponsorPageTxErrorMessage: string = '';
  loadingUpdateSponsorPageIntoIndex: boolean = false;
  loadingPendingUpdates: boolean = false;

  constructor(
  	private _arweave: ArweaveService,
    private _auth: AuthService,
    private _utils: UtilsService,
    public _dialog: MatDialog,
    private _route: ActivatedRoute,
    private _userSettings: UserSettingsService,
    private _arwikiToken: ArwikiTokenContract,
    private _arwikiCategories: ArwikiCategoriesService,
    private _arwikiPages: ArwikiPagesService
  ) { }

  async ngOnInit() {
    this.myAddress = this._auth.getMainAddressSnapshot();
    const adminList: any[] = this._auth.getAdminList();
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;

    // Init arwiki 
    this._arwiki = new Arwiki(this._arweave.arweave);

    // Init ardb
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    // Get pages
    this.loadingApprovedPages = true;
    const numPages = 100;
    let networkInfo;
    let maxHeight = 0;
    try {
      networkInfo = await this._arweave.arweave.network.getInfo();
      maxHeight = networkInfo.height;
    } catch (error) {
      this._utils.message(`${error}`, 'error');
      return;
    }

    const owners = this._auth.getAdminList();
    let verifiedPages: string[] = [];
    let allVerifiedPages: any = {};
    this.approvedPagesSubscription = this._arwikiCategories
      .getCategories()
      .pipe(
        switchMap((categories: ArwikiCategoryIndex) => {
          return this._arwikiPages.getApprovedPages(
            this.routeLang,
            -1
          );
        }),
        switchMap((_approvedPages: ArwikiPageIndex) => {
          allVerifiedPages = _approvedPages;
          verifiedPages = Object.keys(_approvedPages).map((slug) => {
            return _approvedPages[slug].id!;
          });

          return this.arwikiQuery.getTXsData(verifiedPages);
        }),
        switchMap((pages: ArdbTransaction[]|ArdbBlock[]) => {
          let tmp_res: ArwikiPage[] = [];
          for (let p of pages) {
            const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
            const slug = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug');
            tmp_res.push({
              id: pTX.id,
              title: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title'),
              slug: slug,
              category: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category'),
              language: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Lang'),
              value: allVerifiedPages[slug].value,
              img: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img'),
              block: pTX.block,
              lastUpdateAt: allVerifiedPages[slug].lastUpdateAt,
              sponsor: allVerifiedPages[slug].sponsor           
            });
          }
          return of(tmp_res);
        })
      

      ).subscribe({
      next: async (pages: ArwikiPage[]) => {
        this.pages = pages;
        this.loadingApprovedPages = false;
        
      },
      error: (error) => {
        this._utils.message(error, 'error');
        this.loadingApprovedPages = false;
      }
    });


    this.heightSubscription = from(this.getCurrentHeight()).subscribe({
      next: (height)  => {
        this.currentBlockHeight = height;
      },
      error: (error) => {
        this._utils.message(error, 'error');
      }
    });

  }

  /*
  *	@dev Destroy subscriptions
  */
  ngOnDestroy() {
    if (this.approvedPagesSubscription) {
      this.approvedPagesSubscription.unsubscribe();
    }
  }

  underscoreToSpace(_s: string) {
    return _s.replace(/[_]/gi, ' ');
  }


  timestampToDate(_time: number) {
    let d = new Date(_time * 1000);
    return d;
  }

  confirmDeleteArWikiPage(
    _slug: string,
    _pageId: string,
    _category_slug: string
  ) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogConfirmComponent, {
      data: {
        title: 'Are you sure?',
        content: 'You are about to unlist (hide) an arwiki page from the index. Do you want to proceed?'
      },
      direction: direction
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        // Create "delete" tx
        this.loadingDeletePage = true;
        try {
          const tx = await this._arwiki.createDeleteTXForArwikiPage(
            _pageId,
            _slug,
            _category_slug,
            this.routeLang,
            this._auth.getPrivateKey()
          ); 

          this.deleteTxMessage = tx;
          this._utils.message('Success!', 'success');
        } catch (error) {
          this._utils.message(`${error}`, 'error');
        }

      }
    });
  }

  confirmSetMainArWikiPage(
    _slug: string,
    _pageId: string,
    _category_slug: string
  ) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogConfirmComponent, {
      data: {
        title: 'Are you sure?',
        content: `You are about to set ${_slug} as the main page. Do you want to proceed?`
      },
      direction: direction
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        // Create "Mainpage" tx
        this.loadingSetMainPage = true;
        try {
          const tx = await this._arwiki.createMainPageTXForArwikiPage(
            _pageId,
            _slug,
            _category_slug,
            this.routeLang,
            this._auth.getPrivateKey()
          ); 

          this.setMainTxMessage = tx;
          this._utils.message('Success!', 'success');
        } catch (error) {
          this._utils.message(`${error}`, 'error');
        }

      }
    });
  }

  async getCurrentHeight(): Promise<number> {
    let networkInfo: any = {};
    let maxHeight = 0;
    try {
      networkInfo = await this._arweave.arweave.network.getInfo();
      maxHeight = networkInfo.height ? networkInfo.height : 0;
    } catch (error) {
      throw Error(`${error}`);
    }
    return maxHeight;
  }

  confirmStopStake(
    _slug: string
  ) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogConfirmComponent, {
      data: {
        title: 'Are you sure?',
        content: 'You are about to stop your stake and sponsorship for this page. This will unlist the page. Do you want to proceed?'
      },
      direction: direction
    });

    dialogRef.afterClosed().pipe(
        switchMap((result: any) => {
          if (result) {
            this.loadingStopStake = true;
            return this._arwikiPages.stopStaking(
              _slug,
              this.routeLang,
              this._auth.getPrivateKey(),
              arwikiVersion[0]
            );
          }
          return of(null);
        })
      ).subscribe({
        next: (tx) => {
          if (tx) {
            this.stopStakeTxMessage = `${tx}`;
            this._utils.message('Success!', 'success');
          }
          //this.loadingStopStake = false;
        },
        error: (error) => {
          this._utils.message(`${error}`, 'error');
          //this.loadingStopStake = false;
        }
      });
  }

  formatBlocks(_b: number) {
    return `${this._arweave.formatBlocks(_b)}`;
  }

  confirmSponsorArWikiPage(
    _slug: string,
    _category_slug: string,
    _pageValue: number
  ) {
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
      direction: direction
    });

    dialogRef.afterClosed().pipe(
      switchMap((_newPageValue: number) => {
        const newPageValue = +_newPageValue;
        if (Number.isInteger(newPageValue) && newPageValue > 0) {
          this.loadingUpdateSponsorPageIntoIndex = true;
          return this._arwikiPages.updatePageSponsor(
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
          this.updateSponsorPageTxMessage = `${tx}`;
          this._utils.message('Success!', 'success');
        }
      },
      error: (error) => {
        this.updateSponsorPageTxErrorMessage = `${error}`;
        this._utils.message(`${error}`, 'error');
      }
    });
  }

  searchUpdates() {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogSearchPageUpdateComponent, {
      data: {
        langCode: defLang.code
      },
      direction: direction,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async (res) => {
      

    });
  }

}
