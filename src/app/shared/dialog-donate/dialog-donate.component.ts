import { Component, OnInit, Inject, OnDestroy} from '@angular/core';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ArweaveService } from '../../core/arweave.service';
import { AuthService } from '../../auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-dialog-donate',
  templateUrl: './dialog-donate.component.html',
  styleUrls: ['./dialog-donate.component.scss']
})
export class DialogDonateComponent implements OnInit, OnDestroy {
	amount: number = 0;
	maxAmount: number = 0;
  balance: number = 0;
  balanceSubscription: Subscription = Subscription.EMPTY;
  loadingBalance: boolean = false;
  loadingDonationInProgress: boolean = false;
  txDonation: string = '';

  constructor(
  	@Inject(MAT_DIALOG_DATA) public data: any,
  	private _arweave: ArweaveService,
  	private _auth: AuthService,
  	private _snackBar: MatSnackBar) { }

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
          if (this.balance > 10) {
          	this.maxAmount = 10;
          } else if (this.balance > 0) {
          	this.maxAmount = this.balance / 2;
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

  async sendDonation(amount: number, author: string, sponsor: string) {
  	const to = author ? author : sponsor;
  	this.loadingDonationInProgress = true;
  	this.txDonation = '';
  	try {
  		this.txDonation = await this._arweave.sendDonation(to, `${amount}`, this._auth.getPrivateKey());
  	} catch (error) {
  		this.message(`${error}`, 'error');
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
