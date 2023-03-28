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

@Component({
  selector: 'app-page-updates',
  templateUrl: './page-updates.component.html',
  styleUrls: ['./page-updates.component.scss']
})
export class PageUpdatesComponent implements OnInit , OnDestroy {
	loadingPendingPages: boolean = false;
  pages: ArwikiPendingUpdate[] = [];
  pendingPagesSubscription: Subscription = Subscription.EMPTY;
  loadingInsertPageIntoIndex: boolean = false;
  insertPageTxMessage: string = '';
  insertPageTxErrorMessage: string = '';
  arwikiQuery!: ArwikiQuery;
  routeLang: string = '';
  baseURL = this._arweave.baseURL;
  pageSlug: string = '';
  filterForm = new FormGroup({
    accepted: new FormControl(false),
    rejected: new FormControl(false),
    pending: new FormControl(true),
  });

  constructor(
  	private _arweave: ArweaveService,
    private _auth: AuthService,
    private _utils: UtilsService,
    public _dialog: MatDialog,
    private _route: ActivatedRoute,
    private _userSettings: UserSettingsService,
    private _arwikiTokenContract: ArwikiTokenContract,
    private _arwikiPages: ArwikiPagesService,
    private _arwikiPageUpdates: ArwikiPageUpdatesService
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

    // Init ardb instance
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);

    // Get pages
    this.loadingPendingPages = true;
    const numPages = 100;
    let maxHeight = 0;

    this.pendingPagesSubscription = from(
      this._arweave.arweave.network.getInfo()
    ).pipe(
        switchMap((networkInfo) => {
          maxHeight = networkInfo.height;
          return this.arwikiQuery.getPendingPagesUpdates(
            this.routeLang,
            this.pageSlug,
            numPages,
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
          }
          return of(tmp_res);
        }),
        switchMap((pendingPages: ArwikiPageIndex) => {
          return (
            this._arwikiPages.getAllPages(this.routeLang, -1)
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
  }

  underscoreToSpace(_s: string) {
    return this._utils.underscoreToSpace(_s);
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
          this.loadingInsertPageIntoIndex = true;
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
      next: (tx) => {
        if (tx) {
          this.insertPageTxMessage = `${tx}`;
          this._utils.message('Success!', 'success');
        }
      },
      error: (error) => {
        this.insertPageTxErrorMessage = `${error}`;
        this._utils.message(`${error}`, 'error');
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

}
