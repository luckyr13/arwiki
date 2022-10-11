import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ArweaveService } from '../../core/arweave.service';

import {MatSnackBar} from '@angular/material/snack-bar';
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
  selector: 'app-history-updates-approved',
  templateUrl: './history-updates-approved.component.html',
  styleUrls: ['./history-updates-approved.component.scss']
})
export class HistoryUpdatesApprovedComponent implements OnInit, OnDestroy {
  @Input('address') address: string = '';
  @Input('lang') routeLang: string = '';
  private _arwikiQuery: ArwikiQuery|null = null;
  loading: boolean = false;
  pages: ArwikiPage[] = [];
  myPagesSubscription: Subscription = Subscription.EMPTY;
  baseURL: string = this._arweave.baseURL;
  lockButtons: boolean = false;
  displayedColumns: string[] = [
    'slug', 'id', 'by', 'at', 'actions'
  ];
  @ViewChild(MatTable) table: MatTable<any>|null = null;
  updateApprovedBy: Record<string, string>= {};

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
    
    // Get pages 
    this.getMyArWikiPages();
    
  }

  getMyArWikiPages() {
    let myPagesTX: ArdbTransaction[]|ArdbBlock[] = [];
    const maxPages = 100;
    this.pages = [];
    this.loading = true;

    this.myPagesSubscription = this._arwikiTokenContract.getApprovedPages(this.routeLang, -1)
    .subscribe({
      next: (allApprovedPages: ArwikiPageIndex) => {
        const finalPages: ArwikiPage[] = [];
        for (const slug of Object.keys(allApprovedPages)) {
          const updates = allApprovedPages[slug].updates!;

          for (const update of updates) {
            const approvedBy = update.approvedBy;
            const at = +update.at;
            const id = update.tx;
            this.updateApprovedBy[id] = approvedBy;
            finalPages.push({
              id: id,
              title: '',
              slug: slug,
              category: '',
              sponsor: '',
              language: '',
              owner: '',
              start: at
            });
          }
          
        }
        
        this.pages = finalPages.sort((a, b) => {
          return (b.start! - a.start!);
        });
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