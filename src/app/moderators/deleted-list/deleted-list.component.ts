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
import { Direction } from '@angular/cdk/bidi';
import { UserSettingsService } from '../../core/user-settings.service';
import { Arwiki, arwikiVersion } from '../../core/arwiki';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';
import { DialogConfirmAmountComponent } from '../../shared/dialog-confirm-amount/dialog-confirm-amount.component';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';
import { ArwikiCategoriesService } from '../../core/arwiki-contracts/arwiki-categories.service';
import { ArwikiPagesService } from '../../core/arwiki-contracts/arwiki-pages.service';
import { ArwikiPageSponsorService } from '../../core/arwiki-contracts/arwiki-page-sponsor.service';
import { ArwikiAdminsService } from '../../core/arwiki-contracts/arwiki-admins.service';
import { ArwikiPageIndex } from '../../core/interfaces/arwiki-page-index';

@Component({
  selector: 'app-deleted-list',
  templateUrl: './deleted-list.component.html',
  styleUrls: ['./deleted-list.component.scss']
})
export class DeletedListComponent implements OnInit, OnDestroy {
  loadingPages: boolean = false;
  pages: ArwikiPage[] = [];
  pagesSubscription: Subscription = Subscription.EMPTY;
  arwikiQuery!: ArwikiQuery;
  routeLang: string = '';
  private _arwiki!: Arwiki;
  myAddress: string = '';
  currentBlockHeight: number = 0;
  heightSubscription: Subscription = Subscription.EMPTY;
  loadingReactivatePageIntoIndex: boolean = false;
  updatePageTxMessage: string = '';
  updatePageTxErrorMessage: string = '';
  allApprovedPages: ArwikiPageIndex = {};
  ticker = '';

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
    private _arwikiPageSponsor: ArwikiPageSponsorService,
    private _arwikiAdmins: ArwikiAdminsService
  ) { }

  ngOnInit() {
    this.myAddress = this._auth.getMainAddressSnapshot();
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;

    // Init arwiki 
    this._arwiki = new Arwiki(this._arweave.arweave);

    // Init ardb
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    // Get pages
    this.loadingPages = true;
    
    this.pagesSubscription = this.getDeletedPages().subscribe({
      next: async (pages: ArwikiPage[]) => {
        this.pages = pages;
        this.loadingPages = false;
        
      },
      error: (error) => {
        this._utils.message(error, 'error');
        this.loadingPages = false;
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

    this.ticker = this._userSettings.getTokenTicker();

  }

  /*
  *	@dev Destroy subscriptions
  */
  ngOnDestroy() {
    if (this.pagesSubscription) {
      this.pagesSubscription.unsubscribe();
    }
  }

  underscoreToSpace(_s: string) {
    return _s.replace(/[_]/gi, ' ');
  }


  timestampToDate(_time: number) {
    let d = new Date(_time * 1000);
    return d;
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

  getDeletedPages() {
    let allInactivePages: string[] = [];
    let maxHeight = 0;
    
    return from(this._arweave.arweave.network.getInfo())
      .pipe(
        switchMap((networkInfo) => {
          maxHeight = networkInfo.height;
          const reload = true;
          return this._arwikiPages.getAllPages(
            this.routeLang,
            -1,
            reload
          );
        }),
        switchMap((_allPages) => {
          this.allApprovedPages = _allPages;
          
          allInactivePages = Object.keys(this.allApprovedPages)
            .filter((slug) => {
              return !this.allApprovedPages[slug].active;
            })
            .map((slug) => {
              return this.allApprovedPages[slug].id;
            });
          
          return this.arwikiQuery.getTXsData(allInactivePages);
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
            const contentType = pTX.data.type ?
              pTX.data.type :
              this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Content-Type');
            tmp_res.push({
              id: pTX.id,
              title: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title'),
              slug: slug,
              category: this.allApprovedPages[slug].category,
              language: this.routeLang,
              img: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img'),
              value: this.allApprovedPages[slug].value,
              block: pTX.block,
              lastUpdateAt: this.allApprovedPages[slug].lastUpdateAt,
              sponsor: this.allApprovedPages[slug].sponsor,
              dataInfo: { size: pTX.data.size, type: contentType }       
            });
          }
          return of(tmp_res);
        })
      

      );
  }

  confirmReactivateArWikiPage(
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
        content: `You are about to reactivate an old arwiki page. Do you want to proceed?`,
        pageValue: _pageValue + 1,
        second_content: 'Please define the amount of ' + this.ticker + ' tokens to stake:'
      },
      direction: direction
    });

    dialogRef.afterClosed().pipe(
      switchMap((_newPageValue: number) => {
        const newPageValue = +_newPageValue;
        if (Number.isInteger(newPageValue) && newPageValue > 0) {
          this.loadingReactivatePageIntoIndex = true;
          return this._arwikiPageSponsor.updatePageSponsor(
            _slug,
            _category_slug,
            this.routeLang,
            newPageValue,
            this._auth.getPrivateKey(),
            arwikiVersion[0],
          ); 
        } else if (newPageValue === 0) {
          throw Error('Stake must be greater than 0 ' + this.ticker + ' tokens');
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
          this.updatePageTxMessage = `${tx}`;
          this._utils.message('Success!', 'success');
        }

      },
      error: (error) => {
        this.updatePageTxErrorMessage = `Error!`;
        if (typeof error === 'string') {
          this._utils.message(error, 'error');
          this.updatePageTxErrorMessage = `${error}`;
        } else if (error && Object.prototype.hasOwnProperty.call(error, 'message')) {
          this._utils.message(error.message, 'error');
          this.updatePageTxErrorMessage = `${error.message}`;
        }
        console.error('confirmReactivateArWikiPage', error);
      }
    });
  }

}
