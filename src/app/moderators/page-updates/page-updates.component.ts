import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArweaveService } from '../../core/arweave.service';
import { Observable, Subscription, EMPTY, of, from } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { UtilsService } from '../../core/utils.service';
import { switchMap } from 'rxjs/operators';
import {MatDialog} from '@angular/material/dialog';
import { DialogConfirmAmountComponent } from '../../shared/dialog-confirm-amount/dialog-confirm-amount.component';
import { DialogCompareComponent } from '../../shared/dialog-compare/dialog-compare.component';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ActivatedRoute } from '@angular/router';
import { Direction } from '@angular/cdk/bidi';
import { UserSettingsService } from '../../core/user-settings.service';
import { arwikiVersion } from '../../core/arwiki';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { ArwikiCategoryIndex } from '../../core/interfaces/arwiki-category-index';
import { ArwikiPageIndex } from '../../core/interfaces/arwiki-page-index';
import { 
  ArwikiTokenContract 
} from '../../core/arwiki-contracts/arwiki-token.service';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';
import { ArwikiPagesService } from '../../core/arwiki-contracts/arwiki-pages.service';
import { ArwikiPageUpdatesService } from '../../core/arwiki-contracts/arwiki-page-updates.service';
import { FormGroup, FormControl } from '@angular/forms';
import { ArwikiPendingUpdate } from '../../core/interfaces/arwiki-pending-update';
import { ArwikiPageUpdate } from '../../core/interfaces/arwiki-page-update';
import { DialogRejectReasonComponent } from '../../shared/dialog-reject-reason/dialog-reject-reason.component';
import { ArwikiAdminsService } from '../../core/arwiki-contracts/arwiki-admins.service';

@Component({
  selector: 'app-page-updates',
  templateUrl: './page-updates.component.html',
  styleUrls: ['./page-updates.component.scss']
})
export class PageUpdatesComponent implements OnInit , OnDestroy {
	loadingPendingPages: boolean = false;
  pages: ArwikiPendingUpdate[] = [];
  pendingPagesSubscription: Subscription = Subscription.EMPTY;
  loadingInteraction: boolean = false;
  acceptUpdateTx: string = '';
  rejectUpdateTx: string = '';
  interactionErrorMessage: string = '';
  arwikiQuery!: ArwikiQuery;
  routeLang: string = '';
  baseURL = this._arweave.baseURL;
  pageSlug: string = '';
  filterForm = new FormGroup({
    accepted: new FormControl(false),
    rejected: new FormControl(false),
    pending: new FormControl(true),
  });
  numPages = 4;
  totalResults = 0;
  hideBtnMoreUpdates = false;
  loadingNextUpdates = false;
  nextUpdatesSubscription = Subscription.EMPTY;
  allApprovedPages: ArwikiPageIndex = {};
  adminList: string[] = [];
  numRejectedPages = 100;
  maxHeight = 0;

  constructor(
  	private _arweave: ArweaveService,
    private _auth: AuthService,
    private _utils: UtilsService,
    public _dialog: MatDialog,
    private _route: ActivatedRoute,
    private _userSettings: UserSettingsService,
    private _arwikiTokenContract: ArwikiTokenContract,
    private _arwikiPages: ArwikiPagesService,
    private _arwikiPageUpdates: ArwikiPageUpdatesService,
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
    this.pageSlug = this._route.snapshot.paramMap.get('slug')!;

    

    // Get pages
    this.getPendingPages();

  }

  getPendingPages() {
    this.hideBtnMoreUpdates = false;
    this.loadingPendingPages = true;
    // Init ardb instance
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    const arwikiQueryRejected = new ArwikiQuery(this._arweave.arweave);

    this.pendingPagesSubscription = from(
      this._arweave.arweave.network.getInfo()
    ).pipe(
        switchMap((networkInfo) => {
          this.maxHeight = networkInfo.height;
          return this._arwikiAdmins.getAdminList()
        }),
        switchMap((admins) => {
          this.adminList = admins;
          return this.arwikiQuery.getPendingPagesUpdates(
            this.routeLang,
            this.pageSlug,
            this.numPages,
            this.maxHeight
          );
        }),
        switchMap((pendingPages: ArdbTransaction[]|ArdbBlock[]) => {
          let tmp_res: ArwikiPageIndex = {};
          for (let p of pendingPages) {
            const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
            tmp_res[pTX.id] = {
              id: pTX.id,
              title: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title'),
              slug: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug'),
              category: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category'),
              language: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Lang'),
              img: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img'),
              block: pTX.block,
              value: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Value'),
              owner: pTX.owner.address
            };
            this.totalResults += 1;
          }
          return of(tmp_res);
        }),
        switchMap((pendingPages: ArwikiPageIndex) => {
          return (
            this._arwikiPages.getAllPages(this.routeLang, -1)
              .pipe(
                switchMap((_approvedPages: ArwikiPageIndex) => {
                  this.allApprovedPages = _approvedPages;
                  let tmp_filtered_res: Record<string, ArwikiPendingUpdate> = {};
                  let verifiedUpdates: Record<string, ArwikiPageUpdate> = {};
                  const approvedPagesSlugs = Object.keys(_approvedPages);
                  for (const approvedSlug of approvedPagesSlugs) {
                    for (const upd of _approvedPages[approvedSlug].updates!) {
                      verifiedUpdates[upd.tx] = upd; 
                    }
                  }

                  // Check pending updates against verified updates
                  for (let pId in pendingPages) {
                    if (!(pId in verifiedUpdates)) {
                      tmp_filtered_res[pId] = { 
                        page: pendingPages[pId],
                        status: 'pending',
                        updateInfo: null
                      };
                    } else {
                      tmp_filtered_res[pId] = { 
                        page: pendingPages[pId],
                        status: 'accepted',
                        updateInfo: verifiedUpdates[pId]
                      };
                    }
                  }
                  return of(tmp_filtered_res);
                })
              )
          );
        }),
        switchMap((pendingPages: Record<string, ArwikiPendingUpdate>) => {
          const pendingFiltered = Object.keys(pendingPages).filter((id) => {
            return pendingPages[id].status === 'pending'
          });
          return (
            arwikiQueryRejected.getRejectedPageUpdatesByIds(
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
        next: async (pages: ArwikiPendingUpdate[]) => {
          this.pages = pages;
          this.loadingPendingPages = false;
        },
        error: (error) => {
          this._utils.message(error, 'error');
          this.loadingPendingPages = false;
        }
      });
  }

  /*
  *	@dev Destroy subscriptions
  */
  ngOnDestroy() {
    this.pendingPagesSubscription.unsubscribe();
    this.nextUpdatesSubscription.unsubscribe();
  }

  underscoreToSpace(_s: string) {
    return this._utils.underscoreToSpace(_s);
  }
  
  confirmApproveArWikiPageUpdate(
    _slug: string,
    _pageId: string,
    _category_slug: string,
    _pageValue: number
  ) {
    const _author = '';
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';
    this.acceptUpdateTx = '';
    this.interactionErrorMessage = '';

    const dialogRef = this._dialog.open(DialogConfirmAmountComponent, {
      data: {
        title: 'Are you sure?',
        content: `You are about to approve a new arwiki page update. Do you want to proceed?`,
        second_content: 'Please define the page update value in $WIKI tokens:',
        pageValue: _pageValue
      },
      direction: direction
    });

    dialogRef.afterClosed().pipe(
      switchMap((_newPageValue: number) => {
        const newPageValue = +_newPageValue;
        if (Number.isInteger(newPageValue) && newPageValue > 0) {
          this.loadingInteraction = true;
          return this._arwikiPageUpdates.approvePageUpdate(
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
          this.acceptUpdateTx = `${tx}`;
          this._utils.message('Success!', 'success');
        } else {
          this._utils.message(`Error!!`, 'error');
        }
      },
      error: (error) => {
        this.interactionErrorMessage = `Error!`;
        if (typeof error === 'string') {
          this.interactionErrorMessage = error;
          this._utils.message(`Error: ${error}`, 'error');
        } else if (typeof error === 'object' && error && error.message) {
          this.interactionErrorMessage = error.message;
          this._utils.message(`Error: ${this.interactionErrorMessage}`, 'error');
        } else {
          this._utils.message(`Error!`, 'error');
        }
        console.error('confirmApproveArWikiPageUpdate', error);
      }
    });
  }

  timestampToDate(_time: number) {
    return this._utils.timestampToDate(_time);
  }

  getKeys(d: any) {
    return Object.keys(d);
  }

  compare(newPage: string, slug: string) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogCompareComponent, {
      data: {
        newPage,
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

  
  nextUpdates() {
    this.loadingNextUpdates = true;
    const arwikiQueryRejected = new ArwikiQuery(this._arweave.arweave);
    
    this.nextUpdatesSubscription = this.arwikiQuery.getNextResults()
      .pipe(
        switchMap((pendingPages: ArdbTransaction[]|ArdbBlock[]|ArdbTransaction|ArdbBlock) => {
          // Fix       
          if (pendingPages && !Array.isArray(pendingPages)) {
            pendingPages = [pendingPages] as ArdbTransaction[];
          } else if (Array.isArray(pendingPages)) {
            pendingPages = pendingPages as ArdbTransaction[];
          } else {
            this.hideBtnMoreUpdates = true;
            throw Error('End of results');
          }

          let tmp_res: ArwikiPageIndex = {};

          for (let p of pendingPages) {
            const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
            tmp_res[pTX.id] = {
              id: pTX.id,
              title: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title'),
              slug: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug'),
              category: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category'),
              language: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Lang'),
              img: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img'),
              block: pTX.block,
              value: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Value'),
              owner: pTX.owner.address
            };

            this.totalResults += 1;
          }
          return of(tmp_res);
        }),
        switchMap((pendingPages: ArwikiPageIndex) => {
          let tmp_filtered_res: Record<string, ArwikiPendingUpdate> = {};
          let verifiedUpdates: Record<string, ArwikiPageUpdate> = {};
          const approvedPagesSlugs = Object.keys(this.allApprovedPages);
          for (const approvedSlug of approvedPagesSlugs) {
            for (const upd of this.allApprovedPages[approvedSlug].updates!) {
              verifiedUpdates[upd.tx] = upd; 
            }
          }

          // Check pending updates against verified updates
          for (let pId in pendingPages) {
            if (!(pId in verifiedUpdates)) {
              tmp_filtered_res[pId] = { 
                page: pendingPages[pId],
                status: 'pending',
                updateInfo: null
              } ;
            } else {
              tmp_filtered_res[pId] = { 
                page: pendingPages[pId],
                status: 'accepted',
                updateInfo: verifiedUpdates[pId]
              };
            }
          }
          return of(tmp_filtered_res);         
        }),
        switchMap((pendingPages: Record<string, ArwikiPendingUpdate>) => {
          const pendingFiltered = Object.keys(pendingPages).filter((id) => {
            return pendingPages[id].status === 'pending'
          });
          return (
            arwikiQueryRejected.getRejectedPageUpdatesByIds(
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
        next: (pages) => {
          this.pages.push(...pages);
          this.loadingNextUpdates = false;
        },
        error: (error) => {
          this._utils.message(error, 'error');
          this.loadingNextUpdates = false;
        }
      })
  }

  confirmRejectArWikiPageUpdate(
    _slug: string,
    _pageId: string
  ) {
    this.interactionErrorMessage = '';
    this.rejectUpdateTx = '';
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
          this.loadingInteraction = true;
          const jwk = this._auth.getPrivateKey();
          return from(this._arwikiPageUpdates.createRejectTXForArwikiPageUpdate(
            _pageId, _slug, this.routeLang, _reason, jwk, arwikiVersion[0]
          ));
        }
        
        return of(null);
      })
    ).subscribe({
      next: (tx) => {
        if (tx) {
          this.rejectUpdateTx = `${tx}`;
          this._utils.message('Update rejected!', 'success');
        }
      },
      error: (error) => {
        this.interactionErrorMessage = `Error!`;
        if (typeof error === 'string') {
          this.interactionErrorMessage = error;
          this._utils.message(`Error: ${error}`, 'error');
        } else if (typeof error === 'object' && error && error.message) {
          this.interactionErrorMessage = error.message;
          this._utils.message(`Error: ${this.interactionErrorMessage}`, 'error');
        } else {
          this._utils.message(`Error!`, 'error');
        }
        console.error('confirmRejectArWikiPageUpdate', error);
      }
    });
  }

}
