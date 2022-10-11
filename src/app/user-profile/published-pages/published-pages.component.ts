import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ArweaveService } from '../../core/arweave.service';

import {MatSnackBar} from '@angular/material/snack-bar';
import { Observable, Subscription, EMPTY, of, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
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
  selector: 'app-published-pages',
  templateUrl: './published-pages.component.html',
  styleUrls: ['./published-pages.component.scss']
})
export class PublishedPagesComponent implements OnInit, OnDestroy {
  @Input('address') address: string = '';
  private _arwikiQuery: ArwikiQuery|null = null;
  loading: boolean = false;
  pages: ArwikiPage[] = [];
  myPagesSubscription: Subscription = Subscription.EMPTY;
  myPagesNextSubscription = Subscription.EMPTY;
  routeLang: string = '';
  baseURL: string = this._arweave.baseURL;
  lockButtons: boolean = false;
  displayedColumns: string[] = [
    'img', 'title', 'slug', 'category', 'id', 'start'
  ];
  loadingMore = false;
  @ViewChild(MatTable) table: MatTable<any>|null = null;
  eof = false;

  constructor(
    private _router: Router,
    private _snackBar: MatSnackBar,
    private _arweave: ArweaveService,
    private _auth: AuthService,
    private _userSettings: UserSettingsService,
    private _route: ActivatedRoute,
    private _arwikiTokenContract: ArwikiTokenContract
  ) {
  }


   ngOnInit() {
    // Get language from route

    this.routeLang = this._route.snapshot.paramMap.get('lang')!;
    this._route.paramMap.subscribe(params => {
      const lang = params.get('lang');
      if (lang) {
        this.routeLang = lang;
      
      }
    });

    this._arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    
    // Get pages 
    this.getMyArWikiPages();
    
  }

  getMyArWikiPages() {
    let myPagesTX: ArdbTransaction[]|ArdbBlock[] = [];
    const maxPages = 100;
    this.pages = [];
    this.loading = true;

    this.myPagesSubscription = from(this.getCurrentHeight()).pipe(
      switchMap((height) => {
        const anyArWikiVersion = true;
        return this._arwikiQuery!.getMyArWikiPages(
          this.address,
          this.routeLang,
          maxPages,
          height,
          anyArWikiVersion
        );
      }),
      switchMap((pages: ArdbTransaction[]|ArdbBlock[]) => {
        myPagesTX = pages;
        return this._arwikiTokenContract.getApprovedPages(this.routeLang, -1);
      })
    )
    .subscribe({
      next: (allApprovedPages: ArwikiPageIndex) => {
        const finalPages: ArwikiPage[] = [];
        for (let p of myPagesTX) {
          const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
          const title = this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
          const slug = this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug');
          const category = this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category');
          const lang = this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Lang');
          const img = this.sanitizeImg(this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img'));
          const owner = pTX.owner.address;
          const id = pTX.id;
          const pageValue = this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Value');
          const extraData: any = allApprovedPages[slug] && allApprovedPages[slug].content == id 
            ? allApprovedPages[slug] : {};
          const start = extraData.start ? extraData.start : 0;
          const pageRewardAt = extraData.pageRewardAt ? extraData.pageRewardAt : 0;
          const sponsor = extraData.sponsor ? extraData.sponsor : '';

          if (!start) {
            continue;
          }
          
          finalPages.push({
            title,
            slug,
            category,
            img,
            owner,
            language: lang,
            id,
            value: pageValue,
            block: pTX.block,
            start,
            pageRewardAt,
            sponsor
          });
        }

        this.pages = finalPages;
        this.loading = false;

      },
      error: (error) => {
        this.message(error, 'error');
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

  /*
  *  Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
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
        const finalPages: ArwikiPage[] = [];
        for (let p of myPagesTX) {
          const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
          const title = this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
          const slug = this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug');
          const category = this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category');
          const lang = this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Lang');
          const img = this.sanitizeImg(this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img'));
          const owner = pTX.owner.address;
          const id = pTX.id;
          const pageValue = this._arwikiQuery!.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Value');
          const extraData: any = allApprovedPages[slug] && allApprovedPages[slug].content == id 
            ? allApprovedPages[slug] : {};
          const start = extraData.start ? extraData.start : 0;
          const pageRewardAt = extraData.pageRewardAt ? extraData.pageRewardAt : 0;
          const sponsor = extraData.sponsor ? extraData.sponsor : '';

          if (!start) {
            continue;
          }
          
          this.pages.push({
            title,
            slug,
            category,
            img,
            owner,
            language: lang,
            id,
            value: pageValue,
            block: pTX.block,
            start,
            pageRewardAt,
            sponsor
          });
        }

        this.loadingMore = false;
        this.table!.renderRows();

      },
      error: (error) => {
        this.message(error, 'error');
        this.loadingMore = false;
      }
    })
  }

}
