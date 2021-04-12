import { Component, OnInit } from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import { ArweaveService } from '../core/arweave.service';
import { Observable, Subscription, EMPTY } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
declare const window: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
	mainAddress: string = this._auth.getMainAddressSnapshot();
	balance: Observable<string> = this._arweave.getAccountBalance(this.mainAddress);
	loadingMyPages: boolean = false;
  pages: any[] = [];
  loading: boolean = false;
  txmessage: string = '';
  lastTransactionID: Observable<string> = this._arweave.getLastTransactionID(this.mainAddress);
  myPagesSubscription: Subscription = Subscription.EMPTY;

  constructor(
  	private _router: Router,
  	private _snackBar: MatSnackBar,
  	private _arweave: ArweaveService,
    private _auth: AuthService,
  ) { }

  async ngOnInit() {
  	this.loading = true;
  
  	// Fetch data to display
  	// this.loading is updated to false on success
  	this.getUserInfo();

    // Get pages 
    await this.getMyArWikiPages();
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
  *	@dev Get user info
  */
  getUserInfo() {

    this.loading = false;
  }

  /*
  *	@dev Destroy subscriptions
  */
  ngOnDestroy() {
    if (this.myPagesSubscription) {
      this.myPagesSubscription.unsubscribe();
    }
  }

  /*
  * @dev Reload page
  */
  reload() {
    window.location.reload();
  }

  async getMyArWikiPages() {
    const networkInfo = await this._arweave.arweave.network.getInfo();
    const height = networkInfo.height;
    this.loadingMyPages = true;

    this.myPagesSubscription = this._arweave.getMyArWikiPages(
      this._auth.getMainAddressSnapshot(),
      height
    ).subscribe({
      next: (res) => {
        if (res && res.txs && res.txs.edges) {
          this.pages = res.txs.edges;
        }
        this.loadingMyPages = false;

      },
      error: (error) => {
        this.message(error, 'error');
        this.loadingMyPages = false;
      }
    });
  }

  searchKeyNameInTags(_arr: any[], _key: string) {
    let res = '';
    for (const a of _arr) {
      if (a.name === _key) {
        return a.value;
      }
    }
    return res;
  }

  underscoreToSpace(_s: string) {
    return _s.replace(/[_]/gi, ' ');
  }

  

}
