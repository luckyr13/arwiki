import { Component, OnInit, Inject, OnDestroy} from '@angular/core';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ArweaveService } from '../../core/arweave.service';
import { AuthService } from '../../auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token';
import { arwikiVersion } from '../../core/arwiki';

@Component({
  selector: 'app-dialog-vote-page',
  templateUrl: './dialog-vote-page.component.html',
  styleUrls: ['./dialog-vote-page.component.scss']
})
export class DialogVotePageComponent implements OnInit, OnDestroy {
	amount: number = 0;
	maxAmount: number = 0;
  balance: number = 0;
  balanceSubscription: Subscription = Subscription.EMPTY;
  loadingBalance: boolean = false;
  loadingDonationInProgress: boolean = false;
  txDonation: string = '';
  errorMsg: string = '';

  constructor(
  	@Inject(MAT_DIALOG_DATA) public data: any,
  	private _arweave: ArweaveService,
  	private _auth: AuthService,
  	private _snackBar: MatSnackBar,
  	private _arwikiTokenContract: ArwikiTokenContract) { }

  ngOnInit(): void {
  	if (this.data.mainAddress) {
  		this.getBalance();
  	}
  }

  getBalance() {
  	this.loadingBalance = true;
  	this.balance = 0;
  	this.maxAmount = 0;

  	this.balanceSubscription = this._arweave
      .getAccountBalance(this.data.mainAddress)
      .subscribe({
        next: (res: string) => {
          this.balance = +res;
          this.loadingBalance = false;
          if (this.balance >= 1) {
          	this.maxAmount = 1;
          } else if (this.balance > 0) {
          	this.maxAmount = this.balance;
          }
        },
        error: (error: any) => {
          this.loadingBalance = false;
        }
      });
  }

  ngOnDestroy() {
  	if (this.balanceSubscription) {
  		this.balanceSubscription.unsubscribe();
  	}
  }

  async voteAndDonate(
  	amount: number, sponsor: string,
  	slug: string, langCode: string,
  	upvote: boolean
  ) {
  	this.loadingDonationInProgress = true;
  	this.txDonation = '';
  	try {
  		this.txDonation = await this._arwikiTokenContract
  			.votePage(
			    sponsor,
			    amount,
			    langCode,
			    slug,
			    upvote,
			    this._auth.getPrivateKey(),
			    arwikiVersion[0]
			  )
  	} catch (err) {
  		this.errorMsg = err;
  		this.message(err, 'error');
  	}
  }

	/*
  *  Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
  }

}
