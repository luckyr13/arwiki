import { Component, OnInit, OnDestroy, Input, ViewChild, OnChanges } from '@angular/core';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ArweaveService } from '../../core/arweave.service';

import {MatSnackBar} from '@angular/material/snack-bar';
import { Observable, Subscription, EMPTY, of, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
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
  selector: 'app-donations-made',
  templateUrl: './donations-made.component.html',
  styleUrls: ['./donations-made.component.scss']
})
export class DonationsMadeComponent implements OnInit, OnDestroy, OnChanges {
  @Input('address') address: string = '';
  @Input('lang') routeLang: string = '';
  private _arwikiQuery: ArwikiQuery|null = null;
  loading: boolean = false;
  donations: {to: string, amount: string, id: string}[] = [];
  donationsMadeSubscription: Subscription = Subscription.EMPTY;
  donationsMadeNextSubscription = Subscription.EMPTY;
  baseURL: string = this._arweave.baseURL;
  lockButtons: boolean = false;
  displayedColumns: string[] = [
    'to', 'amount', 'id'
  ];
  loadingMore = false;
  @ViewChild(MatTable) table: MatTable<any>|null = null;
  eof = false;
  total = 0;

  constructor(
    private _snackBar: MatSnackBar,
    private _arweave: ArweaveService,
    private _auth: AuthService,
    private _userSettings: UserSettingsService,
    private _arwikiTokenContract: ArwikiTokenContract
  ) {
  }


   ngOnInit() {
    this._arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    
  }

  ngOnChanges() {
    // Get updates 
    this.getMyDonations();
    
  }

  getMyDonations() {
    let donationsTX: ArdbTransaction[]|ArdbBlock[] = [];
    const maxResults = 100;
    this.donations = [];
    this.loading = true;
    this.total = 0;

    this.donationsMadeSubscription = from(this.getCurrentHeight()).pipe(
      switchMap((height) => {
        const anyArWikiVersion = true;
        return this._arwikiQuery!.getMyArWikiDonations(
          this.address,
          maxResults,
          height,
          anyArWikiVersion
        );
      })
    )
    .subscribe({
      next: (donations: ArdbTransaction[]|ArdbBlock[]) => {
        const tmpDonations: {id:string,to:string,amount:string}[] = [];
        let tmpAmount = 0;
        for (let p of donations) {
          const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
          const from = pTX.owner.address;
          const amount = pTX.quantity && pTX.quantity.ar ? pTX.quantity.ar : '0';
          const to = pTX.recipient ? pTX.recipient : '';
          const id = pTX.id;
          tmpDonations.push({
            id,
            to,
            amount
          });
          tmpAmount += +amount;
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
    this.donationsMadeSubscription.unsubscribe();
    this.donationsMadeNextSubscription.unsubscribe();
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
    this.donationsMadeNextSubscription = this._arwikiQuery!.next().subscribe({
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
            to,
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