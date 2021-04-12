import { Component, OnInit } from '@angular/core';
import { ArweaveService } from '../../core/arweave.service';
import { Observable, Subscription, EMPTY, of } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import { switchMap } from 'rxjs/operators';
import { getVerification } from "arverify";

@Component({
  templateUrl: './pending-list.component.html',
  styleUrls: ['./pending-list.component.scss']
})
export class PendingListComponent implements OnInit {
	loadingPendingPages: boolean = false;
  pages: any[] = [];
  pendingPagesSubscription: Subscription = Subscription.EMPTY;
  arverifyProcessedAddressesMap: any = {};

  constructor(
  	private _arweave: ArweaveService,
    private _auth: AuthService,
    private _snackBar: MatSnackBar
  ) { }

  async ngOnInit() {
    // Get current height for query
    let networkInfo = null;
    let height = null;
    try {
      networkInfo = await this._arweave.arweave.network.getInfo();
      height = networkInfo.height;
    } catch (err) {
    	this.message(err, 'error');
    }
    // Get pages
    this.loadingPendingPages = true;

    this.pendingPagesSubscription = this.getPendingPages(
      height
    ).pipe(
      switchMap((res) => {
        let pages = [];
        let tmp_res = [];
        if (res && res.txs && res.txs.edges) {
          pages = res.txs.edges;
        }
        for (let p of pages) {
          tmp_res.push({
            id: p.node.id,
            title: this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Title'),
            slug: this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug'),
            category: this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Category'),
            language: this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Lang'),
            owner: p.node.owner.address,
          });
        }
        return of(tmp_res);
      })
    )
    .subscribe({
      next: async (pages) => {
        this.pages = pages;
        this.loadingPendingPages = false;
        this.arverifyProcessedAddressesMap = {};

        for (let p of pages) {
          // Avoid duplicates
          if (
            Object.prototype.hasOwnProperty.call(
              this.arverifyProcessedAddressesMap, 
              p.owner
            )
          ) {
            continue;
          }
          const arverifyQuery = await this.getArverifyVerification(p.owner);
          this.arverifyProcessedAddressesMap[p.owner] = arverifyQuery;
        }

      },
      error: (error) => {
        this.message(error, 'error');
        this.loadingPendingPages = false;
      }
    });

  }

  /*
  *	Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 8000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
  }

  /*
  *	@dev Destroy subscriptions
  */
  ngOnDestroy() {
    if (this.pendingPagesSubscription) {
      this.pendingPagesSubscription.unsubscribe();
    }
  }

   /*
  * @dev
  */
  getPendingPages(_height: number): Observable<any> {
    const owners: any = [];
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['page'],
      },
    ];

    const obs = this._arweave.arweaveQuery(
      owners,
      tags,
      _height
    );

    return obs;
  }


  async getArverifyVerification(_address: string) {
    const verification = await getVerification(_address);

    return ({
      verified: verification.verified,
      icon: verification.icon,
      percentage: verification.percentage
    });
  }

  searchKeyNameInTags(_arr: any[], _key: string) {
    let res = '';
    for (const a of _arr) {
      if (a.name.toUpperCase() === _key.toUpperCase()) {
        return a.value;
      }
    }
    return res;
  }

  underscoreToSpace(_s: string) {
    return _s.replace(/[_]/gi, ' ');
  }


}
