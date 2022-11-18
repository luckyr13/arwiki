import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ArweaveService } from '../../core/arweave.service';
import { UtilsService } from '../../core/utils.service';
import { Observable, Subscription, EMPTY, of, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { UserSettingsService } from '../../core/user-settings.service';
import { arwikiVersion } from '../../core/arwiki';
import { Location } from '@angular/common';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { ArwikiPageIndex } from '../../core/interfaces/arwiki-page-index';
import { 
  ArwikiTokenContract 
} from '../../core/arwiki-contracts/arwiki-token.service';
declare const window: any;
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';
import {MatTable} from '@angular/material/table';

@Component({
  selector: 'app-history-pages-rejected',
  templateUrl: './history-pages-rejected.component.html',
  styleUrls: ['./history-pages-rejected.component.scss']
})
export class HistoryPagesRejectedComponent implements OnInit, OnDestroy {
  @Input('address') address: string = '';
  @Input('lang') routeLang: string = '';
  private _arwikiQuery: ArwikiQuery|null = null;
  loading: boolean = false;
  pages: ArwikiPage[] = [];
  myPagesSubscription: Subscription = Subscription.EMPTY;
  myPagesNextSubscription = Subscription.EMPTY;
  baseURL: string = this._arweave.baseURL;
  lockButtons: boolean = false;
  displayedColumns: string[] = [
    'slug',  'id', 'reason', 'actions', 
  ];
  loadingMore = false;
  @ViewChild(MatTable) table: MatTable<any>|null = null;
  eof = false;
  reasonPageRejected: Record<string, string> = {};

  constructor(
    private _utils: UtilsService,
    private _arweave: ArweaveService,
    private _auth: AuthService,
    private _userSettings: UserSettingsService,
    private _arwikiTokenContract: ArwikiTokenContract
  ) {
  }


   ngOnInit() {

    this._arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    
    // Get pages 
    this.getPagesRejected();
    
  }

  getPagesRejected() {
    const maxPages = 100;
    this.pages = [];
    this.loading = true;

    this.myPagesSubscription = from(this.getCurrentHeight()).pipe(
      switchMap((height) => {
        const anyArWikiVersion = true;
        return this._arwikiQuery!.getRejectedPagesByOwners(
          this.address,
          this.routeLang,
          maxPages,
          height,
          anyArWikiVersion
        );
      })
    )
    .subscribe({
      next: (myPagesTX: ArdbTransaction[]|ArdbBlock[]) => {
        const finalPages: ArwikiPage[] = [];
        for (let p of myPagesTX) {
          const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
          const title = this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
          const slug = this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug');
          const lang = this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Lang');
          const owner = '';
          const id = this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Id');

          const reason = this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Reason');
          const category = '';
          const img = '';

          this.reasonPageRejected[id] = reason;

          finalPages.push({
            title,
            slug,
            category,
            img,
            owner,
            language: lang,
            id,
            block: pTX.block
          });
        }

        this.pages = finalPages;
        this.loading = false;

      },
      error: (error) => {
        this._utils.message(error, 'error');
        this.loading = false;
      }
    });
  }


  /*
  *  @dev Destroy subscriptions
  */
  ngOnDestroy() {
    this.myPagesSubscription.unsubscribe();
    this.myPagesNextSubscription.unsubscribe();
  }

  sanitizeImg(_img: string) {
    let res: string = _img.indexOf('http') >= 0 ?
      _img :
      _img ? `${this.baseURL}${_img}` : '';
    return res;
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
  
  loadMoreResults() {
    let myPagesTX: ArdbTransaction[]|ArdbBlock[] = [];
    this.loadingMore = true;
    this.myPagesNextSubscription = this._arwikiQuery!.next().pipe(
      switchMap((pages) => {
        myPagesTX = pages as ArdbTransaction[];
        const myPagesList = [];

        for (let p of (pages as ArdbTransaction[])) {
          myPagesList.push(p.id);
        }

        if (myPagesList.length === 0) {
          this.eof = true;
          return of({});
        }
        
        return this._arwikiTokenContract.getApprovedPages(this.routeLang, -1);
      })
    ).subscribe({
      next: (allApprovedPages: ArwikiPageIndex) => {
        for (let p of myPagesTX) {
          const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
          const title = this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
          const slug = this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug');
          const lang = this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Lang');
          const owner = '';
          const id = pTX.id;
          const reason = this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Reason');
          const category = '';
          const img = '';

          this.reasonPageRejected[id] = reason;

          this.pages.push({
            title,
            slug,
            category,
            img,
            owner,
            language: lang,
            id,
            block: pTX.block
          });
        }

        this.loadingMore = false;
        this.table!.renderRows();

      },
      error: (error) => {
        this._utils.message(error, 'error');
        this.loadingMore = false;
      }
    })
  }

}