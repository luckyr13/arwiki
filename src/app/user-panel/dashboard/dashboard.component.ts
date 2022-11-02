import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import { ArweaveService } from '../../core/arweave.service';
import { Observable, Subscription, EMPTY, of, from } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { UserSettingsService } from '../../core/user-settings.service';
import { ArwikiQuery } from '../../core/arwiki-query';
import { Location } from '@angular/common';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';
declare const window: any;
import {MatDialog} from '@angular/material/dialog';
import { Direction } from '@angular/cdk/bidi';
import { 
  DialogTransferTokensComponent 
} from '../../shared/dialog-transfer-tokens/dialog-transfer-tokens.component';
import { 
  DialogVaultComponent 
} from '../../shared/dialog-vault/dialog-vault.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
	mainAddress: string = this._auth.getMainAddressSnapshot();
	balance: string = '';
	balancePST: string = '';
  balancePSTVault: string = '';
  balancePSTStaked: string = '';
  balanceSubscription: Subscription = Subscription.EMPTY;
  balancePSTSubscription: Subscription = Subscription.EMPTY;
  allBalancesSubscription: Subscription = Subscription.EMPTY;
  networkInfoSubscription: Subscription = Subscription.EMPTY;
  loadingBalance: boolean = false;
  loadingBalancePST: boolean = false;
  loadingSettings: boolean = false;
  loadingAllBalances: boolean = false;
  txmessage: string = '';
  lastTransactionID: Observable<string> = this._arweave.getLastTransactionID(
    this.mainAddress
  );
  loadingTotalSupply: boolean = false;
  totalSupplySubscription: Subscription = Subscription.EMPTY;
  totalSupply: number = 0;
  lockMinLength: number = 0;
  lockMaxLength: number = 0;
  vault: any = null;
  currentHeight: number = 0;
  routeLang = '';
  chartMyBalanceItems: {name: string, value: number}[] = [];
  tokenName = '';
  tokenTicker = '';
  tokenNameTickerSubscription = Subscription.EMPTY;
  pstSettings: any = [];
  pstSettingsSubscription: Subscription = Subscription.EMPTY;
  
  constructor(
  	private _snackBar: MatSnackBar,
  	private _arweave: ArweaveService,
    private _auth: AuthService,
    private _userSettings: UserSettingsService,
    private _location: Location,
    private _arwikiTokenContract: ArwikiTokenContract,
    public _dialog: MatDialog
  ) { }

  ngOnInit() {
    this.loadingBalance = true;
    this.balanceSubscription = this._arweave
      .getAccountBalance(this.mainAddress)
      .subscribe({
        next: (res: string) => {
          this.balance = res;
          this.loadingBalance = false;
        },
        error: (error) => {
          this.message(error, 'error');
          this.loadingBalance = false;
        }
      });

    this.loadingBalancePST = true;
    this.balancePSTSubscription = this._arwikiTokenContract
      .getBalanceAndTotalSupply(this.mainAddress, true)
      .subscribe({
        next: (res: any) => {
          const balance = res.balance;
          const totalSupply = res.totalSupply;
          const unlockedBalance = +balance.unlockedBalance;
          const vaultBalance = +balance.vaultBalance;
          const stakingBalance = +balance.stakingBalance;
          this.balancePST = `${unlockedBalance}`;
          this.balancePSTVault = `${vaultBalance}`;
          this.balancePSTStaked = `${stakingBalance}`;
          this.loadingBalancePST = false;

          this.loadDataChartMyBalance(unlockedBalance, vaultBalance, stakingBalance, totalSupply);
        },
        error: (error) => {
          this.message(error, 'error');
          this.loadingBalancePST = false;
        }
      });

    
    this.loadingTotalSupply = true;
    this.totalSupplySubscription = this._arwikiTokenContract
      .getTotalSupply()
      .subscribe({
        next: (res: any) => {
          this.totalSupply = +res;
          this.loadingTotalSupply = false;
        },
        error: (error) => {
          this.message(error, 'error');
          this.loadingTotalSupply = false;
        }
      });

    this.loadingAllBalances = true;
    this.allBalancesSubscription = this._arwikiTokenContract
      .getAllBalances()
      .subscribe({
        next: (res: any) => {
          this.vault = Object.prototype.hasOwnProperty.call(res.vault, this.mainAddress) ?
             res.vault[this.mainAddress] : [];
          this.loadingAllBalances = false;
        },
        error: (error) => {
          this.message(error, 'error');
          this.loadingAllBalances = false;
        }
      });

      this.networkInfoSubscription = from(
        this._arweave.arweave.network.getInfo()
      ).subscribe({
        next: (networkInfo: any) => {
          this.currentHeight = networkInfo.height;
        },
        error: (error) => {
          this.message(error, 'error');

        }
      });

    this.tokenNameTickerSubscription = this._arwikiTokenContract.getTokenNameAndTicker().subscribe((res) => {
      this.tokenName = res.name;
      this.tokenTicker = res.ticker;
    });

    this.pstSettingsSubscription = this._arwikiTokenContract
      .getSettings()
      .subscribe({
        next: (res: any) => {
          this.pstSettings = res;
          const settings = [
            {
              key: 'quorum',
              label: 'Quorum',
              formatFunction: this.decimalToPercentage
            },
            {
              key: 'support',
              label: 'Support',
              formatFunction: this.decimalToPercentage
            },
            {
              key: 'lockMinLength',
              label: 'Lock minimum length',
              formatFunction: (val: any) => this.formatBlocks(val)
            },
            {
              key: 'lockMaxLength',
              label: 'Lock maximum length',
              formatFunction: (val: any) => this.formatBlocks(val)
            },
            {
              key: 'voteLength',
              label: 'Vote length',
              formatFunction: (val: any) => this.formatBlocks(val)
            },
            {
              key: 'pageApprovalLength',
              label: 'Page approval length',
              formatFunction: (val: any) => this.formatBlocks(val)
            }
          ];

          for (const i in settings) {
            const key = settings[i].key;
            const formatFunction = settings[i].formatFunction;
            const value = this.pstSettings.get(key);

            if (key === 'lockMinLength') {
              this.lockMinLength = value;
            }
            if (key === 'lockMaxLength') {
              this.lockMaxLength = value;
            }
          }
       

          this.loadingSettings = false;
        },
        error: (error) => {
          this.message(error, 'error');
          this.loadingSettings = false;
        }
      });

  }

  ngOnDestroy() {
    this.balanceSubscription.unsubscribe();
    this.balancePSTSubscription.unsubscribe();
    this.allBalancesSubscription.unsubscribe();
    this.networkInfoSubscription.unsubscribe();
  }

  /*
  *	Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
  }


  goBack() {
    this._location.back();
  }

  getPSTContractAddress() {
    return this._arwikiTokenContract.contractAddress;
  }

  transferTokensDialog() {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogTransferTokensComponent, {
      data: {
        langCode: defLang.code,
        balance: this.balancePST
      },
      direction: direction,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async (res) => {
      

    });
  }

  async vaultDialog() {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';
    
    const dialogRef = this._dialog.open(DialogVaultComponent, {
      data: {
        balance: this.balancePST,
        lockMinLength: this.lockMinLength,
        lockMaxLength: this.lockMaxLength,
        vault: this.vault,
        currentHeight: this.currentHeight
      },
      direction: direction,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async (res) => {
      

    });
  }

  loadDataChartMyBalance(
    unlockedBalance: number,
    vaultBalance: number,
    stakingBalance: number,
    totalSupply: number) {
    let balances: { value: number, name: string }[] = [];

    if (unlockedBalance) {
      balances.push({ name: 'Available $WIKI', value: unlockedBalance});
    }
    if (vaultBalance) {
      balances.push({ name: '$WIKI in Vault', value: vaultBalance});
    }
    if (stakingBalance) {
      balances.push({ name: '$WIKI Staked', value: stakingBalance});
    }
    //if (totalSupply) {
      //balances.push({ name: 'Total $WIKI Supply', value: totalSupply });
    //}
    this.chartMyBalanceItems = balances;
  }



  ellipsis(s: string) {
    const minLength = 12;
    const sliceLength = 5;

    if (!s || typeof(s) !== 'string') {
      return '';
    }

    return s && s.length < minLength ? s : `${s.substring(0, sliceLength)}...${s.substring(s.length - sliceLength, s.length)}`;
  }

  getMyTotalBalance() {
    const ans = +this.balancePST + +this.balancePSTVault + +this.balancePSTStaked;
    return ans;
  }
  decimalToPercentage(n: number): string {
    return `${(n*100)}%`;
  }

  formatBlocks(len: number): string {
    return this._arweave.formatBlocks(len);
  }
}
