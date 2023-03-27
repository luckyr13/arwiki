import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';
import { 
  Observable, Subscription, EMPTY,
  of, switchMap, from } from 'rxjs';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { ArwikiPageIndex } from '../../core/interfaces/arwiki-page-index';
import { ArwikiQuery } from '../../core/arwiki-query';
import { UtilsService } from '../../core/utils.service';
import { ArweaveService } from '../../core/arweave.service';
import {  } from 'rxjs';
import { 
  ArwikiTokenContract 
} from '../../core/arwiki-contracts/arwiki-token.service';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';
import { ArwikiPagesService } from '../../core/arwiki-contracts/arwiki-pages.service';
import { ArwikiPageUpdate } from '../../core/interfaces/arwiki-page-update';
import { FormGroup, FormControl } from '@angular/forms';

interface ArwikiPendingUpdate {
  page: ArwikiPage;
  status:'accepted'|'rejected'|'pending';
  updateInfo: ArwikiPageUpdate|null
}

@Component({
  selector: 'app-dialog-search-page-update',
  templateUrl: './dialog-search-page-update.component.html',
  styleUrls: ['./dialog-search-page-update.component.scss']
})
export class DialogSearchPageUpdateComponent implements OnInit, OnDestroy {
	loadingPendingUpdates: boolean = false;
  pages: ArwikiPendingUpdate[] = [];
  pendingPagesSubscription: Subscription = Subscription.EMPTY;
  arwikiQuery!: ArwikiQuery;
  langCode: string = '';
  numPages = 10;
  hideBtnMoreUpdates = false;
  loadingNextUpdates = false;
  nextUpdatesSubscription = Subscription.EMPTY;
  totalResults = 0;
  filterForm = new FormGroup({
    accepted: new FormControl(false),
    rejected: new FormControl(false),
    pending: new FormControl(true)
  });

  constructor(
  	@Inject(MAT_DIALOG_DATA) public data: any,
  	private _arweave: ArweaveService,
    private _utils: UtilsService,
    private _arwikiTokenContract: ArwikiTokenContract,
    private _router: Router,
    public _dialogRef: MatDialogRef<DialogSearchPageUpdateComponent>,
    private _arwikiPages: ArwikiPagesService
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
  	this.langCode = this.data.langCode;
  	// Init ardb instance
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    this.getUpdates();
  }

  ngOnDestroy() {
    this.pendingPagesSubscription.unsubscribe();
    this.nextUpdatesSubscription.unsubscribe();
  }

  getUpdates() {
    // Get pages
    this.loadingPendingUpdates = true;
    let maxHeight = 0;
    this.totalResults = 0;
   
    this.pendingPagesSubscription = from(
      this._arweave.arweave.network.getInfo()
    ).pipe(
      switchMap((networkInfo) => {
        maxHeight = networkInfo.height;
        return this.arwikiQuery.getPendingPagesUpdatesByLang(
          this.langCode,
          this.numPages,
          maxHeight
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
          };
          this.totalResults += 1;
        }
        return of(tmp_res);
      }),
      switchMap((pendingPages: ArwikiPageIndex) => {
        return (
          this._arwikiPages.getAllPages(this.langCode, -1)
            .pipe(
              switchMap((_approvedPages: ArwikiPageIndex) => {
                let tmp_filtered_res: ArwikiPendingUpdate[] = [];
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
                    tmp_filtered_res.push({ 
                      page: pendingPages[pId],
                      status: 'pending',
                      updateInfo: null
                    });
                  } else {
                    tmp_filtered_res.push({ 
                      page: pendingPages[pId],
                      status: 'accepted',
                      updateInfo: verifiedUpdates[pId]
                    });
                  }
                }
                return of(tmp_filtered_res);
              })
            )
        );
      })
    ).subscribe({
      next: (pages: ArwikiPendingUpdate[]) => {
        this.pages = pages;
        this.loadingPendingUpdates = false;

      },
      error: (error) => {
        this._utils.message(error, 'error');
        this.loadingPendingUpdates = false;
      }
    });
  }

  getKeys(d: any) {
    return Object.keys(d);
  }

  viewUpdates(slug: string) {
  	this.close();
  	this._router.navigate([
  		this.langCode, 'moderators', 'page-updates', slug
  	]);
  }

  close() {
  	this._dialogRef.close();
  }

  nextUpdates() {
    this.loadingNextUpdates = true;
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
              
            };

            this.totalResults += 1;
          }
          return of(tmp_res);
        }),
        switchMap((pendingPages: ArwikiPageIndex) => {
          return (
            this._arwikiPages.getApprovedPages(this.langCode, -1)
              .pipe(
                switchMap((_approvedPages: ArwikiPageIndex) => {
                  let tmp_filtered_res: ArwikiPendingUpdate[] = [];
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
                      tmp_filtered_res.push({ 
                        page: pendingPages[pId],
                        status: 'pending',
                        updateInfo: null
                      });
                    } else {
                      tmp_filtered_res.push({ 
                        page: pendingPages[pId],
                        status: 'accepted',
                        updateInfo: verifiedUpdates[pId]
                      });
                    }
                  }
                  return of(tmp_filtered_res);
                })
              )
          );
        })
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

  timestampToDate(timestamp: number) {
    return this._utils.timestampToDate(timestamp);
  }

}
