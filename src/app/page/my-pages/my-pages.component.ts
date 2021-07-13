import { Component, OnInit, OnDestroy } from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import { ArweaveService } from '../../core/arweave.service';
import { Observable, Subscription, EMPTY, of, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { UserSettingsService } from '../../core/user-settings.service';
import { ArwikiQuery } from '../../core/arwiki-query';
import { arwikiVersion } from '../../core/arwiki';
import { Location } from '@angular/common';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { 
  ArwikiTokenContract 
} from '../../core/arwiki-contracts/arwiki-token';
declare const window: any;

@Component({
  selector: 'app-my-pages',
  templateUrl: './my-pages.component.html',
  styleUrls: ['./my-pages.component.scss']
})
export class MyPagesComponent implements OnInit, OnDestroy {
	loading: boolean = false;
  pages: ArwikiPage[] = [];
  myPagesSubscription: Subscription = Subscription.EMPTY;
  routeLang: string = '';
  arwikiQuery!: ArwikiQuery;
  baseURL: string = this._arweave.baseURL;
  currentBlockHeight: number = 0;
  heightSubscription: Subscription = Subscription.EMPTY;
  lockButtons: boolean = false;
  loadingAction: boolean = false;
  rewardSubscription: Subscription = Subscription.EMPTY;
  rewardTX: string = '';

  constructor(
    private _router: Router,
    private _snackBar: MatSnackBar,
    private _arweave: ArweaveService,
    private _auth: AuthService,
    private _userSettings: UserSettingsService,
    private _route: ActivatedRoute,
    private _location: Location,
    private _arwikiTokenContract: ArwikiTokenContract
  ) { }

  ngOnInit() {
    // Get language from route

    this.routeLang = this._route.snapshot.paramMap.get('lang')!;
    this._route.paramMap.subscribe(params => {
      const lang = params.get('lang');
      if (lang) {
        this.routeLang = lang;
      
      }
    });

    //this.loading = true;
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    
    // Get pages 
    this.getMyArWikiPages();
  
    
    this.heightSubscription = from(this.getCurrentHeight()).subscribe({
      next: (height)  => {
        this.currentBlockHeight = height;
      },
      error: (error) => {
        this.message(error, 'error');
      }
    });
  }


	goBack() {
  	this._location.back();
  }


  getMyArWikiPages() {
    this.loading = true;
    let myPagesTX = {};
    let allVerifiedPages: any = {};
    this.myPagesSubscription = this.arwikiQuery!.getMyArWikiPages(
      this._auth.getMainAddressSnapshot(),
      this.routeLang
    ).pipe(
      switchMap((pages) => {
        myPagesTX = pages;
        return this._arwikiTokenContract.getApprovedPages(this.routeLang, -1);
      }),
      switchMap((_approvedPages) => {
        allVerifiedPages = _approvedPages;
        return of(myPagesTX);
      }),
    )
    .subscribe({
      next: (pages: any) => {
        const finalPages: ArwikiPage[] = [];
        for (let p of pages) {
          const title = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Title');
          const slug = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug');
          const category = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Category');
          const lang = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Lang');
          const img = this.sanitizeImg(this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Img'));
          const owner = p.node.owner.address;
          const id = p.node.id;
          const pageValue = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Value');
          const extraData = allVerifiedPages[slug] && allVerifiedPages[slug].content == id 
            ? allVerifiedPages[slug] : {};
          const start = extraData.start ? extraData.start : 0;
          const pageRewardAt = extraData.pageRewardAt ? extraData.pageRewardAt : 0;
          const sponsor = extraData.sponsor ? extraData.sponsor : '';
          
          finalPages.push({
            title,
            slug,
            category,
            img,
            owner,
            language: lang,
            id,
            value: pageValue,
            block: p.node.block,
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
    if (this.myPagesSubscription) {
      this.myPagesSubscription.unsubscribe();
    }
    if (this.heightSubscription) {
      this.heightSubscription.unsubscribe();
    }
    if (this.rewardSubscription) {
      this.rewardSubscription.unsubscribe();
    }
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
      throw Error(error);
    }
    return maxHeight;
  }

  async unlockReward(lang: string, slug: string) {
    this.lockButtons = true;
    this.loadingAction = true;

    const target = this._auth.getMainAddressSnapshot();
    const key = this._auth.getPrivateKey();

    this.rewardSubscription = from(this._arwikiTokenContract.claimReward( 
      target, slug, lang, key, arwikiVersion[0]
    )).subscribe({
      next: (res) => {
        this.rewardTX = res;
        this.lockButtons = false;
        this.loadingAction = false;
      },
      error: (error) => {
        this.message(error, 'error');
        this.lockButtons = false;
        this.loadingAction = false;
      }
    });

  }
  
  formatBlocks(_b: number) {
    return `${this._arweave.formatBlocks(_b)}`;
  }
}
