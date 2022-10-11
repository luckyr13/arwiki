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
import { 
  ArwikiTokenContract 
} from '../../core/arwiki-contracts/arwiki-token.service';
declare const window: any;
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';
import {MatTable} from '@angular/material/table';

@Component({
  selector: 'app-donations-received',
  templateUrl: './donations-received.component.html',
  styleUrls: ['./donations-received.component.scss']
})
export class DonationsReceivedComponent implements OnInit, OnDestroy {
  @Input('address') address: string = '';
  private _arwikiQuery: ArwikiQuery|null = null;
  loading: boolean = false;
  donations: {from: string, amount: string, id: string}[] = [];
  donationsReceivedSubscription: Subscription = Subscription.EMPTY;
  donationsReceivedNextSubscription = Subscription.EMPTY;
  routeLang: string = '';
  baseURL: string = this._arweave.baseURL;
  lockButtons: boolean = false;
  displayedColumns: string[] = [
    'from', 'amount', 'id'
  ];
  loadingMore = false;
  @ViewChild(MatTable) table: MatTable<any>|null = null;
  eof = false;
  total = 0;

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
      
        this._arwikiQuery = new ArwikiQuery(this._arweave.arweave);
        
        // Get donations made by the user 
        this.getMyDonationsReceived();
      }
    });

    this._arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    
    // Get updates 
    this.getMyDonationsReceived();
    
  }

  getMyDonationsReceived() {
    let donationsTX: ArdbTransaction[]|ArdbBlock[] = [];
    const maxResults = 100;
    this.donations = [];
    this.loading = true;
    this.total = 0;

    this.donationsReceivedSubscription = from(this.getCurrentHeight()).pipe(
      switchMap((height) => {
        const anyArWikiVersion = true;
        return this._arwikiQuery!.getMyArWikiDonationsReceived(
          this.address,
          maxResults,
          height,
          anyArWikiVersion
        );
      })
    )
    .subscribe({
      next: (donations: ArdbTransaction[]|ArdbBlock[]) => {
        const tmpDonations: {id:string,from:string,amount:string}[] = [];
        let tmpAmount = 0;
        for (let p of donations) {
          const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
          const from = pTX.owner.address;
          const amount = pTX.quantity && pTX.quantity.ar ? pTX.quantity.ar : '0';
          const to = pTX.recipient ? pTX.recipient : '';
          const id = pTX.id;
          tmpAmount += +amount;
          tmpDonations.push({
            id,
            from,
            amount
          })
        }

        this.donations = tmpDonations;
        this.total = tmpAmount;

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
    this.donationsReceivedSubscription.unsubscribe();
    this.donationsReceivedNextSubscription.unsubscribe();
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
    
    this.loadingMore = true;
    this.donationsReceivedNextSubscription = this._arwikiQuery!.next().subscribe({
      next: (donations) => {
        const ans = donations as ArdbTransaction[];
        if (ans.length === 0) {
          this.eof = true;
        }

        for (let p of ans) {
          const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
          const from = pTX.owner.address;
          const amount = pTX.quantity.ar;
          const to = pTX.recipient;
          const id = pTX.id;
          this.total += +amount;
          this.donations.push({
            from,
            amount,
            id
          })
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