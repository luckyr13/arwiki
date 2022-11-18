import { Component, OnInit, Inject, OnDestroy} from '@angular/core';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ArweaveService } from '../../core/arweave.service';
import { AuthService } from '../../auth/auth.service';
import { UtilsService } from '../../core/utils.service';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';
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
  voteAndDonateSubscription: Subscription = Subscription.EMPTY;

  constructor(
  	@Inject(MAT_DIALOG_DATA) public data: any,
  	private _arweave: ArweaveService,
  	private _auth: AuthService,
  	private _utils: UtilsService,
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
    if (this.voteAndDonateSubscription) {
      this.voteAndDonateSubscription.unsubscribe();
    }
  }

  voteAndDonate(
  	amount: number, sponsor: string,
  	slug: string, langCode: string,
  	upvote: boolean
  ) {
  	this.loadingDonationInProgress = true;

    if (sponsor == this._auth.getMainAddressSnapshot()) {
      const error = 'Invalid action. You are the sponsor!';
      this.errorMsg = `${error}`;
      this._utils.message(`${error}`, 'error');
      return;
    }
  	
  	this.voteAndDonateSubscription = this._arwikiTokenContract
			.votePage(
		    sponsor,
		    `${amount}`,
		    langCode,
		    slug,
		    upvote,
		    this._auth.getPrivateKey(),
		    arwikiVersion[0],
		  ).subscribe({
        next: (res) => {
          this.txDonation = `${res}`;
        }, 
        error: (error) => {
          this.errorMsg = `${error}`;
          this._utils.message(`${error}`, 'error');
        }
      })
  	
  }

}
