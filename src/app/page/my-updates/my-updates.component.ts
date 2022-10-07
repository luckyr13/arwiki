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
} from '../../core/arwiki-contracts/arwiki-token.service';
declare const window: any;
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';

@Component({
  selector: 'app-my-updates',
  templateUrl: './my-updates.component.html',
  styleUrls: ['./my-updates.component.scss']
})
export class MyUpdatesComponent implements OnInit , OnDestroy {
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
    let myPagesTX: ArdbTransaction[]|ArdbBlock[] = [];
    this.myPagesSubscription = this.arwikiQuery!.getMyArWikiPagesUpdates(
      this._auth.getMainAddressSnapshot(),
      this.routeLang
    ).pipe(
      switchMap((pages: ArdbTransaction[]|ArdbBlock[]) => {
        myPagesTX = pages;
        return this._arwikiTokenContract.getApprovedPages(this.routeLang, -1);
      })
    )
    .subscribe({
      next: (allVerifiedPages: any) => {
        const finalPages: ArwikiPage[] = [];
        for (let p of myPagesTX) {
          const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
          const title = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
          const slug = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug');
          const category = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category');
          const lang = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Lang');
          const img = this.sanitizeImg(this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img'));
          const owner = pTX.owner.address;
          const id = pTX.id;
          const pageValue = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Value');
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
      throw Error(`${error}`);
    }
    return maxHeight;
  }

}
