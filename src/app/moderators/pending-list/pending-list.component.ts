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
import { FormGroup, FormControl } from '@angular/forms';
import { ArwikiPendingPage } from '../../core/interfaces/arwiki-pending-page';

@Component({
  templateUrl: './pending-list.component.html',
  styleUrls: ['./pending-list.component.scss']
})
export class PendingListComponent implements OnInit, OnDestroy {
	loadingPendingPages: boolean = false;
  pages: ArwikiPendingPage[] = [];
  pendingPagesSubscription: Subscription = Subscription.EMPTY;
  loadingInsertPageIntoIndex: boolean = false;
  insertPageTxMessage: string = '';
  insertPageTxErrorMessage: string = '';
  arwikiQueryPending!: ArwikiQuery;
  routeLang: string = '';
  loadingRejectPage: boolean = false;
  rejectPageTxMessage: string = '';
  rejectPageTxErrorMessage: string = '';
  hideBtnMoreArticles = false;
  loadingNextPendingArticles = false;
  numPendingPages = 10;
  nextResultsSubscription = Subscription.EMPTY;
  numRejectedPages = 100;
  adminList: string[] = [];
  maxHeight = 0;
  totalResults = 0;
  filterForm = new FormGroup({
    accepted: new FormControl(false),
    rejected: new FormControl(false),
    pending: new FormControl(true),
  });
  allApprovedPages: ArwikiPageIndex = {};

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

  get accepted() {
    return this.filterForm.get('accepted')!;
  }

  get rejected() {
    return this.filterForm.get('rejected')!;
  }

  get pending() {
    return this.filterForm.get('pending')!;
  }

  ngOnInit() {
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;

    this.getPendingPages();
  }

  /*
  *	@dev Destroy subscriptions
  */
  ngOnDestroy() {
    this.pendingPagesSubscription.unsubscribe();
    this.nextResultsSubscription.unsubscribe();
  }
  
  confirmValidateArWikiPage(
    _author: string,
    _slug: string,
    _pageId: string,
    _category_slug: string,
    _pageValue: number
  ) {
    const defLang = this._userSettings.getDefaultLang();
    const order = 0;
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
            _author,
            _pageId,
            _slug,
            _category_slug,
            this.routeLang,
            newPageValue,
            order,
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
        this.insertPageTxErrorMessage = `Error!`;
        if (typeof error === 'string') {
          this.insertPageTxErrorMessage = error;
          this._utils.message(`Error: ${error}`, 'error');
        } else if (typeof error === 'object' && error && error.message) {
          this.insertPageTxErrorMessage = error.message;
          this._utils.message(`Error: ${this.insertPageTxErrorMessage}`, 'error');
        } else {
          this._utils.message(`Error!`, 'error');
        }
        console.error('confirmValidation', error);
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
          return from(this._arwikiPages.createRejectTXForArwikiPage(
            _pageId, _slug, this.routeLang, _reason, jwk, arwikiVersion[0]
          ));
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
        this.rejectPageTxErrorMessage = `Error!`;
        if (typeof error === 'string') {
          this.rejectPageTxErrorMessage = error;
          this._utils.message(`Error: ${error}`, 'error');
        } else if (typeof error === 'object' && error && error.message) {
          this.rejectPageTxErrorMessage = error.message;
          this._utils.message(`Error: ${this.rejectPageTxErrorMessage}`, 'error');
        } else {
          this._utils.message(`Error!`, 'error');
        }
        console.error('confirmRejectArWikiPage', error);
      }
    });
  }

  getPendingPages() {
    this.hideBtnMoreArticles = false;
    this.loadingNextPendingArticles = false;

    // Init ardb instance
    this.arwikiQueryPending = new ArwikiQuery(this._arweave.arweave);
    const arwikiQueryRejected = new ArwikiQuery(this._arweave.arweave);

    // Get pages
    this.loadingPendingPages = true;
    this.pages = [];

    this.pendingPagesSubscription = from(
      this._arweave.arweave.network.getInfo()
    ).pipe(
        switchMap((networkInfo) => {
          this.maxHeight = networkInfo.height;
          return this._arwikiAdmins.getAdminList()
        }),
        switchMap((admins) => {
          this.adminList = admins;
          const onlyActiveCategories = false;
          return this._arwikiCategories.getCategories(onlyActiveCategories);
        }),
        switchMap((categories: ArwikiCategoryIndex) => {
          return this.arwikiQueryPending.getPendingPages(
            this.routeLang,
            Object.keys(categories),
            this.numPendingPages,
            this.maxHeight
          );
        }),
        switchMap((pendingPages: ArdbTransaction[]|ArdbBlock[]) => {
          let allPendingPages: ArwikiPageIndex = {};
          for (let p of pendingPages) {
            const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
            const contentType = pTX.data.type ?
              pTX.data.type :
              this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Content-Type');
            allPendingPages[pTX.id] = {
              id: pTX.id,
              title: this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title'),
              slug: this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug'),
              category: this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category'),
              language: this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Lang'),
              img: this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img'),
              block: pTX.block,
              value: this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Value'),
              owner: pTX.owner.address,
              dataInfo: { size: pTX.data.size, type: contentType }
            };
            this.totalResults += 1;
          }
          return of(allPendingPages);
        }),
        switchMap((pendingPages: ArwikiPageIndex) => {
          return (
            this._arwikiPages.getAllPages(this.routeLang, -1)
              .pipe(
                switchMap((_approvedPages) => {
                  this.allApprovedPages = _approvedPages; 
                  let tmp_res: Record<string, ArwikiPendingPage> = {};
                  
                  // Check pending pages against verified page updates
                  const appr: ArwikiPage[] = Object.values(_approvedPages);
                  const allUpdates: string[] = [];
                  for (const page of appr) {
                    const updates = page.updates!.map((u) => {
                      return u.tx;
                    });
                    allUpdates.push(...updates);
                  }
                  for (let pId in pendingPages) {
                    if (!(allUpdates.indexOf(pId) >= 0)) {
                      tmp_res[pId] = {
                        page: pendingPages[pId],
                        status: 'pending'
                      };
                    } else {
                      tmp_res[pId] = {
                        page: pendingPages[pId],
                        status: 'accepted'
                      };
                    }
                  }

                  return of(tmp_res);
                })
              )
          );
        }),
        switchMap((pendingPages: Record<string, ArwikiPendingPage>) => {
          const pendingFiltered = Object.keys(pendingPages).filter((id) => {
            return pendingPages[id].status === 'pending'
          });
          return (
            arwikiQueryRejected.getRejectedPagesByIds(
                this.adminList,
                pendingFiltered,
                this.numRejectedPages,
                this.maxHeight
              )
              .pipe(
                switchMap((_rejectedIntersection: ArdbTransaction[]|ArdbBlock[]) => {
                  let rejected: string[] = [];

                  for (let p of _rejectedIntersection) {
                    const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
                    const rejectedId = arwikiQueryRejected.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Id');
                    rejected.push(rejectedId);
                  }

                  for (let pId in pendingPages) {
                    if (rejected.indexOf(pId) >= 0) {
                      pendingPages[pId].status = 'rejected';
                    }
                  }

                  return of(Object.values(pendingPages));
                })
              )
          );
        }),

      ).subscribe({
        next: async (pages: ArwikiPendingPage[]) => {
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
    this.loadingNextPendingArticles = true;
    const arwikiQueryRejected = new ArwikiQuery(this._arweave.arweave);
    let allPendingPages: ArwikiPageIndex = {};
    this.nextResultsSubscription = this.arwikiQueryPending.getNextResults()
      .pipe(
        switchMap((pendingPages: ArdbTransaction[]|ArdbBlock[]|ArdbTransaction|ArdbBlock) => {
          // Fix       
          if (pendingPages && !Array.isArray(pendingPages)) {
            pendingPages = [pendingPages] as ArdbTransaction[];
          } else if (Array.isArray(pendingPages)) {
            pendingPages = pendingPages as ArdbTransaction[];
          } else {
            this.hideBtnMoreArticles = true;
            throw Error('End of results');
          }
          for (let p of pendingPages) {
            const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
            const contentType = pTX.data.type ?
              pTX.data.type :
              this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Content-Type');
            allPendingPages[pTX.id] = {
              id: pTX.id,
              title: this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title'),
              slug: this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug'),
              category: this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category'),
              language: this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Lang'),
              img: this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img'),
              block: pTX.block,
              value: this.arwikiQueryPending.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Value'),
              owner: pTX.owner.address,
              dataInfo: { size: pTX.data.size, type: contentType }
            };
            this.totalResults += 1;
          }

          return of(allPendingPages);
        }),
        switchMap((pendingPages: ArwikiPageIndex) => {
          
          let tmp_res: Record<string, ArwikiPendingPage> = {};
          
          // Check pending pages against verified page updates
          const appr: ArwikiPage[] = Object.values(this.allApprovedPages);
          const allUpdates: string[] = [];
          for (const page of appr) {
            const updates = page.updates!.map((u) => {
              return u.tx;
            });
            allUpdates.push(...updates);
          }
          for (let pId in pendingPages) {
            if (!(allUpdates.indexOf(pId) >= 0)) {
              tmp_res[pId] = {
                page: pendingPages[pId],
                status: 'pending'
              };
            } else {
              tmp_res[pId] = {
                page: pendingPages[pId],
                status: 'accepted'
              };
            }
          }

          return of(tmp_res);
        }),
        switchMap((pendingPages: Record<string, ArwikiPendingPage>) => {
          const pendingFiltered = Object.keys(pendingPages).filter((id) => {
            return pendingPages[id].status === 'pending'
          });
          return (
            arwikiQueryRejected.getRejectedPagesByIds(
                this.adminList,
                pendingFiltered,
                this.numRejectedPages,
                this.maxHeight
              )
              .pipe(
                switchMap((_rejectedIntersection: ArdbTransaction[]|ArdbBlock[]) => {
                  let rejected: string[] = [];

                  for (let p of _rejectedIntersection) {
                    const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
                    const rejectedId = arwikiQueryRejected.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Id');
                    rejected.push(rejectedId);
                  }

                  for (let pId in pendingPages) {
                    if (rejected.indexOf(pId) >= 0) {
                      pendingPages[pId].status = 'rejected';
                    }
                  }

                  return of(Object.values(pendingPages));
                })
              )
          );
        }),
      ).subscribe({
        next: (results) => {
          this.pages.push(...results);
          
          this.loadingNextPendingArticles = false;
        },
        error: (error) => {
          this._utils.message(error, 'error');
          this.loadingNextPendingArticles = false;
        }
      });
  }
 

}
