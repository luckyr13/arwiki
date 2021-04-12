import { Component, OnInit } from '@angular/core';
import { ArweaveService } from '../../core/arweave.service';
import { Observable, Subscription, EMPTY } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  templateUrl: './pending-list.component.html',
  styleUrls: ['./pending-list.component.scss']
})
export class PendingListComponent implements OnInit {
	loadingPendingPages: boolean = false;
  pages: any[] = [];
  pendingPagesSubscription: Subscription = Subscription.EMPTY;

  constructor(
  	private _arweave: ArweaveService,
    private _auth: AuthService,
    private _snackBar: MatSnackBar
  ) { }

  async ngOnInit() {
    // Get pages 
    try {
    	await this.getPendingArWikiPages();
    } catch (err) {
    	this.message(err, 'error');
    }

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
    //  {
    //    name: 'Arwiki-Type',
    //    values: ['page'],
    //  },
    ];

    const obs = this._arweave.arweaveQuery(
      owners,
      tags,
      _height
    );

    return obs;
  }

  async getPendingArWikiPages() {
    const networkInfo = await this._arweave.arweave.network.getInfo();
    const height = networkInfo.height;
    this.loadingPendingPages = true;

    this.pendingPagesSubscription = this.getPendingPages(
      height
    ).subscribe({
      next: (res) => {
        if (res && res.txs && res.txs.edges) {
          this.pages = res.txs.edges;
        }
        this.loadingPendingPages = false;

      },
      error: (error) => {
        this.message(error, 'error');
        this.loadingPendingPages = false;
      }
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
