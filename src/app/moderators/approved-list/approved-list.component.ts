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
import { ArwikiPageSponsorService } from '../../core/arwiki-contracts/arwiki-page-sponsor.service';

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
  stopStakeTxMessage: string = '';
  stopStakeErrorMessage: string = '';
  loadingStopStake: boolean = false;
  private _arwiki!: Arwiki;
  myAddress: string = '';
  currentBlockHeight: number = 0;
  heightSubscription: Subscription = Subscription.EMPTY;
  baseURL = this._arweave.baseURL;
  updateSponsorPageTxMessage: string = '';
  updateSponsorPageTxErrorMessage: string = '';
  loadingUpdateSponsorPageIntoIndex: boolean = false;
  loadingPendingUpdates: boolean = false;

  allApprovedPages: ArwikiPageIndex = {};
  numArticles = 8;
  incrementNumArticles = 4;
  nextArticlesSubscription = Subscription.EMPTY;
  loadingNextArticles = false;
  hideBtnMoreArticles = false;
  allArticlesBySlug: string[] = [];

  constructor(
  	private _arweave: ArweaveService,
    private _auth: AuthService,
    private _utils: UtilsService,
    public _dialog: MatDialog,
    private _route: ActivatedRoute,
    private _userSettings: UserSettingsService,
    private _arwikiToken: ArwikiTokenContract,
    private _arwikiCategories: ArwikiCategoriesService,
    private _arwikiPages: ArwikiPagesService,
    private _arwikiPageSponsor: ArwikiPageSponsorService
  ) { }

  async ngOnInit() {
    this.myAddress = this._auth.getMainAddressSnapshot();
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;
    this.loadApprovedPages(this.numArticles);

  }

  /*
  *	@dev Destroy subscriptions
  */
  ngOnDestroy() {
    this.approvedPagesSubscription.unsubscribe();
  }

  timestampToDate(_time: number) {
    return this._utils.timestampToDate(_time);
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
            return this._arwikiPageSponsor.stopStaking(
              _slug,
              this.routeLang,
              this._auth.getPrivateKey(),
              arwikiVersion[0]
            );
          }
          return of(null);
        })
      ).subscribe({
        next: (res) => {
          let tx = '';
          if (res && Object.prototype.hasOwnProperty.call(res, 'originalTxId')) {
            tx = res.originalTxId;
          } else if (res && Object.prototype.hasOwnProperty.call(res, 'bundlrResponse') &&
            res.bundlrResponse && Object.prototype.hasOwnProperty.call(res.bundlrResponse, 'id')) {
            tx = res.bundlrResponse.id;
          }

          if (tx) {
            this.stopStakeTxMessage = `${tx}`;
            this._utils.message('Success!', 'success');
          } else {
            this.stopStakeErrorMessage = 'Error';
            this._utils.message('Error!', 'error');
          }
          //this.loadingStopStake = false;
        },
        error: (error) => {
          this.stopStakeErrorMessage = 'Error';
          if (typeof error === 'string') {
            this.stopStakeErrorMessage = error;
            this._utils.message(`Error: ${error}`, 'error');
          } else if (typeof error === 'object' && error && error.message) {
            this.stopStakeErrorMessage = error.message;
            this._utils.message(`Error: ${error.message}`, 'error');
          } else {
            this._utils.message(`Error!`, 'error');
          }
          console.error('confirmStopStake', error);
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
          return this._arwikiPageSponsor.updatePageSponsor(
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
      next: (res) => {
        let tx = '';
        if (res && Object.prototype.hasOwnProperty.call(res, 'originalTxId')) {
          tx = res.originalTxId;
        } else if (res && Object.prototype.hasOwnProperty.call(res, 'bundlrResponse') &&
          res.bundlrResponse && Object.prototype.hasOwnProperty.call(res.bundlrResponse, 'id')) {
          tx = res.bundlrResponse.id;
        }

        if (tx) {
          this.updateSponsorPageTxMessage = `${tx}`;
          this._utils.message('Success!', 'success');
        } else {
          this._utils.message('Error!', 'error');
        }
      },
      error: (error) => {
        if (typeof error === 'string') {
          this.updateSponsorPageTxErrorMessage = `${error}`;
          this._utils.message(`Error: ${error}`, 'error');
        } else if (typeof error === 'object' && error && error.message) {
          this.updateSponsorPageTxErrorMessage = `${error.message}`;
          this._utils.message(`Error: ${error.message}`, 'error');
        } else {
          this._utils.message(`Error!`, 'error');
        }
        console.error('confirmSponsorArWikiPage', error);
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

  loadApprovedPages(numArticles: number) {
    // Init ardb
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    // Get pages
    this.loadingApprovedPages = true;
    this.pages = [];
    this.allApprovedPages = {};
    this.allArticlesBySlug = [];

    let maxHeight = 0;

    let verifiedPages: string[] = [];
    this.approvedPagesSubscription = from(
        this._arweave.arweave.network.getInfo()
      ).pipe(
        switchMap((networkInfo) => {
          maxHeight = networkInfo.height;
          const reloadState = true;
          return this._arwikiPages.getApprovedPages(
            this.routeLang,
            -1,
            reloadState
          );
        }),
        switchMap((_approvedPages: ArwikiPageIndex) => {
          this.allApprovedPages = _approvedPages;

          // Sort desc
          verifiedPages = Array.prototype.sort.call(Object.keys(_approvedPages), (a, b) => {
            return _approvedPages[b].lastUpdateAt! - _approvedPages[a].lastUpdateAt!;
          });
          // Get a copy
          this.allArticlesBySlug = [...verifiedPages];

          // Slice array
          verifiedPages = Array.prototype.slice.call(verifiedPages, 0, numArticles);

          verifiedPages = verifiedPages.map((slug) => {
            return _approvedPages[slug].id!;
          });

          return this.arwikiQuery.getTXsData(verifiedPages);
        }),
        switchMap((pages: ArdbTransaction[]|ArdbBlock[]) => {
          let tmp_res: ArwikiPage[] = [];

          for (let p of pages) {
            const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
            const id = pTX.id;
            const tmpSlug = Object.keys(this.allApprovedPages).find((s) => {
              return this.allApprovedPages[s].id === id;
            });
            const slug = tmpSlug ? tmpSlug : '';
            const category = this.allApprovedPages[slug].category;
            const contentType = pTX.data.type ?
              pTX.data.type :
              this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Content-Type');
            
            tmp_res.push({
              id: id,
              title: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title'),
              slug: slug,
              category: category,
              language: this.routeLang,
              value: this.allApprovedPages[slug].value,
              img: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img'),
              block: pTX.block,
              lastUpdateAt: this.allApprovedPages[slug].lastUpdateAt,
              sponsor: this.allApprovedPages[slug].sponsor,
              owner: pTX.owner.address,
              dataInfo: { size: pTX.data.size, type: contentType }    
            });
          }

          // Sort by lastUpdateAt
          Array.prototype.sort.call(tmp_res, (a, b) => {
            return b.lastUpdateAt - a.lastUpdateAt;
          });
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
  }

  nextArticles(increment: number) {
    const fromPos = this.numArticles;
    this.numArticles += increment;
    this.loadingNextArticles = true;

    // Slice array
    let verifiedPages = Array.prototype.slice.call(
      this.allArticlesBySlug, fromPos, this.numArticles
    );
    verifiedPages = verifiedPages.map((slug) => {
      return this.allApprovedPages[slug].id!;
    });

    if (!verifiedPages || !verifiedPages.length) {
      this.hideBtnMoreArticles = true;
    }

    this.nextArticlesSubscription = this.arwikiQuery.getTXsData(verifiedPages).pipe(
      switchMap((pages: ArdbTransaction[]|ArdbBlock[]) => {
        const latestPages: ArwikiPage[] = [];
        for (let p of pages) {
          const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
          const title = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
          //const slug = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug');
          //const category = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category');
          const img = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img');
          //const language = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Lang');
          const owner = pTX.owner.address;
          const id = pTX.id;
          const block = pTX.block;
          const tmpSlug = Object.keys(this.allApprovedPages).find((s) => {
            return this.allApprovedPages[s].id === id;
          });
          const slug = tmpSlug ? tmpSlug : '';
          const category = this.allApprovedPages[slug].category;

          const sponsor = this.allApprovedPages[slug].sponsor;
          const contentType = pTX.data.type ?
              pTX.data.type :
              this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Content-Type');
          latestPages.push({
            title: title,
            slug: slug,
            category: category,
            img: img,
            id: id,
            block: block,
            language: this.routeLang,
            lastUpdateAt: this.allApprovedPages[slug].lastUpdateAt,
            sponsor: sponsor,
            owner: owner,
            dataInfo: { size: pTX.data.size, type: contentType }
          });
        }
        // Sort desc
        Array.prototype.sort.call(latestPages, (a, b) => {
          return b.lastUpdateAt! - a.lastUpdateAt!;
        });
        return of(latestPages);
      })
    ).subscribe({
      next: async (pages: ArwikiPage[]) => {
        this.pages.push(...pages);
        this.loadingNextArticles = false;
      },
      error: (error) => {
        this._utils.message(error, 'error');
        this.loadingNextArticles = false;
      }
    });
  }

}
