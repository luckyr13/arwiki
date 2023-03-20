import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArweaveService } from '../../core/arweave.service';
import { Observable, Subscription, EMPTY, of, from } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { UtilsService } from '../../core/utils.service';
import { switchMap } from 'rxjs/operators';
import {MatDialog} from '@angular/material/dialog';
import { DialogConfirmAmountComponent } from '../../shared/dialog-confirm-amount/dialog-confirm-amount.component';
import { DialogRejectReasonComponent } from '../../shared/dialog-reject-reason/dialog-reject-reason.component';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ActivatedRoute } from '@angular/router';
import { Direction } from '@angular/cdk/bidi';
import { UserSettingsService } from '../../core/user-settings.service';
import { arwikiVersion } from '../../core/arwiki';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { ArwikiCategoryIndex } from '../../core/interfaces/arwiki-category-index';
import { ArwikiPageIndex } from '../../core/interfaces/arwiki-page-index';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';
import { ArwikiCategoriesService } from '../../core/arwiki-contracts/arwiki-categories.service';
import { ArwikiPagesService } from '../../core/arwiki-contracts/arwiki-pages.service';
import { ArwikiAdminsService } from '../../core/arwiki-contracts/arwiki-admins.service';

@Component({
  templateUrl: './pending-list.component.html',
  styleUrls: ['./pending-list.component.scss']
})
export class PendingListComponent implements OnInit, OnDestroy {
	loadingPendingPages: boolean = false;
  pages: ArwikiPageIndex = {};
  pendingPagesSubscription: Subscription = Subscription.EMPTY;
  loadingInsertPageIntoIndex: boolean = false;
  insertPageTxMessage: string = '';
  insertPageTxErrorMessage: string = '';
  arwikiQueryPending!: ArwikiQuery;
  routeLang: string = '';
  baseURL = this._arweave.baseURL;
  loadingRejectPage: boolean = false;
  rejectPageTxMessage: string = '';
  rejectPageTxErrorMessage: string = '';
  hideBtnMoreArticles = false;
  loadingNextPendingArticles = false;
  numPendingPages = 4;

  constructor(
  	private _arweave: ArweaveService,
    private _auth: AuthService,
    private _utils: UtilsService,
    public _dialog: MatDialog,
    private _route: ActivatedRoute,
    private _userSettings: UserSettingsService,
    private _arwikiCategories: ArwikiCategoriesService,
    private _arwikiPages: ArwikiPagesService,
    private _arwikiAdmins: ArwikiAdminsService
  ) { }

  ngOnInit() {
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;

    this.getPendingPages();
  }

  /*
  *	@dev Destroy subscriptions
  */
  ngOnDestroy() {
    if (this.pendingPagesSubscription) {
      this.pendingPagesSubscription.unsubscribe();
    }
  }
  
  confirmValidateArWikiPage(
    _slug: string,
    _pageId: string,
    _category_slug: string,
    _pageValue: number
  ) {
    const _author = '';
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogConfirmAmountComponent, {
      data: {
        title: 'Are you sure?',
        content: `You are about to approve a new arwiki page. Remember to have enough balance to stake and some other in your vault! Do you want to proceed?`,
        pageValue: _pageValue,
        second_content: 'Please define the final page value:'
      },
      direction: direction
    });


    dialogRef.afterClosed().pipe(
      switchMap((_newPageValue: number) => {
        const newPageValue = +_newPageValue;
        if (Number.isInteger(newPageValue) && newPageValue > 0) {
          this.loadingInsertPageIntoIndex = true;
          return this._arwikiPages.approvePage(
            _pageId,
            _author,
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
          this.insertPageTxMessage = `${tx}`;
          this._utils.message('Success!', 'success');
        } else {
          this._utils.message(`Error!!`, 'error');
        }
      },
      error: (error) => {
        console.error('confirmValidation', error);
        this.insertPageTxErrorMessage = `Error!`;
        this._utils.message(`Error!`, 'error');
      }
    });
  }



  timestampToDate(_time: number) {
    return this._utils.timestampToDate(_time);
  }

  getKeys(d: any) {
    return Object.keys(d);
  }

  confirmRejectArWikiPage(
    _slug: string,
    _pageId: string
  ) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogRejectReasonComponent, {
      data: {
        id: _pageId
      },
      direction: direction
    });


    dialogRef.afterClosed().pipe(
      switchMap((_reason: string) => {
        if (_reason) {
          this.loadingRejectPage = true;
          const jwk = this._auth.getPrivateKey();
          return this._arwikiPages.createRejectTXForArwikiPage(
            _pageId, _slug, this.routeLang, _reason, jwk, arwikiVersion[0]
          );
        }
        
        return of(null);
      })
    ).subscribe({
      next: (tx) => {
        if (tx) {
          this.rejectPageTxMessage = `${tx}`;
          this._utils.message('Page rejected!', 'success');
        }
      },
      error: (error) => {
        console.error('reject', error);
        this.rejectPageTxErrorMessage = `Error!`;
        this._utils.message(`Error!`, 'error');
      }
    });
  }

  getPendingPages() {
    // Init ardb instance
    this.arwikiQueryPending = new ArwikiQuery(this._arweave.arweave);
    const arwikiQueryRejected = new ArwikiQuery(this._arweave.arweave);

    // Get pages
    this.loadingPendingPages = true;
    const numRejectedPages = 100;
    let maxHeight = 0;
    let allPendingPages: ArwikiPageIndex = {};
    let adminList: string[] = [];

    this.pendingPagesSubscription = from(
      this._arweave.arweave.network.getInfo()
    ).pipe(
        switchMap((networkInfo) => {
          maxHeight = networkInfo.height;
          return this._arwikiAdmins.getAdminList()
        }),
        switchMap((admins) => {
          adminList = admins;
          return this._arwikiCategories.getCategories()
        }),
        switchMap((categories: ArwikiCategoryIndex) => {
          return this.arwikiQueryPending.getPendingPages(
            this.routeLang,
            Object.keys(categories),
            this.numPendingPages,
            maxHeight
          );
        }),
        switchMap((pendingPages: ArdbTransaction[]|ArdbBlock[]) => {
          for (let p of pendingPages) {
            const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
            allPendingPages[pTX.id] = {
              id: pTX.id,
              title: this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title'),
              slug: this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug'),
              category: this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category'),
              language: this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Lang'),
              img: this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img'),
              block: pTX.block,
              value: this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Value'),
              
            };
          }
          return of(allPendingPages);
        }),
        switchMap((pendingPages: ArwikiPageIndex) => {
          return (
            this._arwikiPages.getAllPages(this.routeLang, -1)
              .pipe(
                switchMap((_approvedPages) => {
                  let tmp_res: ArwikiPageIndex = {};
                  const verifiedPages: string[] = Object.keys(_approvedPages).map((slug) => {
                    return _approvedPages[slug].id;
                  });
                  // Check pending pages against verified pages
                  for (let pId in pendingPages) {
                    if (!(verifiedPages.indexOf(pId) >= 0)) {
                      tmp_res[pId] = pendingPages[pId];
                    }
                  }

                  return of(tmp_res);
                })
              )
          );
        }),
        switchMap((pendingPages: ArwikiPageIndex) => {
          return (
            arwikiQueryRejected.getRejectedPagesByIds(
                adminList, Object.keys(pendingPages), numRejectedPages, maxHeight
              )
              .pipe(
                switchMap((_rejectedIntersection: ArdbTransaction[]|ArdbBlock[]) => {
                  let rejected: string[] = [];
                  let finalIndex: ArwikiPageIndex = {};

                  for (let p of _rejectedIntersection) {
                    const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
                    const rejectedId = arwikiQueryRejected.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Id');
                    rejected.push(rejectedId);
                  }

                  for (let pId in pendingPages) {
                    if (rejected.indexOf(pId) < 0) {
                      finalIndex[pId] = pendingPages[pId];
                    }
                  }

                  return of(finalIndex);
                })
              )
          );
        }),

      ).subscribe({
        next: async (pages: ArwikiPageIndex) => {
          this.pages = pages;
          this.loadingPendingPages = false;
          
        },
        error: (error) => {
          this._utils.message(error, 'error');
          this.loadingPendingPages = false;
        }
      });
  }

  nextPendingArticles() {
    alert('next')
  }
 

}
