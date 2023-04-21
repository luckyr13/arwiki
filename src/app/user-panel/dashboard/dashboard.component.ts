import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { UtilsService } from '../../core/utils.service';
import { ArweaveService } from '../../core/arweave.service';
import { Observable, Subscription, EMPTY, of, from } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
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
import { ArwikiUserBalance } from '../../core/interfaces/arwiki-user-balance'

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
	mainAddress: string = '';
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
  ticker = '';
  tokenNameTickerSubscription = Subscription.EMPTY;
  pstSettings: any = [];
  pstSettingsSubscription: Subscription = Subscription.EMPTY;
  allBalances: ArwikiUserBalance[] = [];
  
  constructor(
  	private _utils: UtilsService,
  	private _arweave: ArweaveService,
    private _auth: AuthService,
    private _userSettings: UserSettingsService,
    private _location: Location,
    private _arwikiTokenContract: ArwikiTokenContract,
    public _dialog: MatDialog,
    private _route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.ticker = this._userSettings.getTokenTicker();
    this.loadInitialValues();
    this._route.paramMap.subscribe(async params => {
      const lang = params.get('lang');
      this.routeLang = lang!;
    });
  }


  loadInitialValues() {
    this.mainAddress = this._auth.getMainAddressSnapshot();
    this.loadArweaveBalance();
    this.loadPSTBalance();
    this.loadTotalSupply();
    this.loadNetworkInfo();
    this.loadTokenInfo();
    this.loadPSTSettings();
    this.loadVaultAndBalances();
  }

  loadArweaveBalance() {
    this.loadingBalance = true;
    this.balance = '';
    this.balanceSubscription = this._arweave
      .getAccountBalance(this.mainAddress)
      .subscribe({
        next: (res: string) => {
          this.balance = res;
          this.loadingBalance = false;
        },
        error: (error) => {
          this._utils.message(error, 'error');
          this.loadingBalance = false;
        }
      });
  }

  loadPSTBalance() {
    this.loadingBalancePST = true;
    this.balancePST = ``;
    this.balancePSTVault = ``;
    this.balancePSTStaked = ``;

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
          this._utils.message(error, 'error');
          this.loadingBalancePST = false;
        }
      });
  }

  loadTotalSupply() {
    this.loadingTotalSupply = true;
    this.totalSupply = 0;
    this.totalSupplySubscription = this._arwikiTokenContract
      .getTotalSupply()
      .subscribe({
        next: (res: any) => {
          this.totalSupply = +res;
          this.loadingTotalSupply = false;
        },
        error: (error) => {
          this._utils.message(error, 'error');
          this.loadingTotalSupply = false;
        }
      });
  }

  loadVaultAndBalances() {
    this.loadingAllBalances = true;
    this.vault = [];
    this.allBalancesSubscription = this._arwikiTokenContract
      .getAllBalances(true)
      .subscribe({
        next: (res: any) => {
          this.vault = Object.prototype.hasOwnProperty.call(res.vault, this.mainAddress) ?
             res.vault[this.mainAddress] : [];

          this.allBalances = Object.values(this.getTotalBalances(res));

          this.loadingAllBalances = false;
        },
        error: (error) => {
          this._utils.message(error, 'error');
          this.loadingAllBalances = false;
        }
      });
  }

  loadNetworkInfo() {
    this.networkInfoSubscription = from(
      this._arweave.arweave.network.getInfo()
    ).subscribe({
      next: (networkInfo: any) => {
        this.currentHeight = networkInfo.height;
      },
      error: (error) => {
        this._utils.message(error, 'error');
      }
    });
  }

  loadTokenInfo() {
    this.tokenNameTickerSubscription = this._arwikiTokenContract.getTokenNameAndTicker().subscribe((res) => {
      this.tokenName = res.name;
    });
  }

  loadPSTSettings() {
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
          this._utils.message(error, 'error');
          this.loadingSettings = false;
        }
      });
  }

  ngOnDestroy() {
    this.balanceSubscription.unsubscribe();
    this.balancePSTSubscription.unsubscribe();
    this.allBalancesSubscription.unsubscribe();
    this.networkInfoSubscription.unsubscribe();
    this.tokenNameTickerSubscription.unsubscribe();
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

    dialogRef.afterClosed().subscribe(async (resTX) => {
      if (resTX) {
        this.loadInitialValues();
      }
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

    dialogRef.afterClosed().subscribe(async (resTX) => {
      if (resTX) {
        this.loadInitialValues();
      }
    });
  }

  loadDataChartMyBalance(
    unlockedBalance: number,
    vaultBalance: number,
    stakingBalance: number,
    totalSupply: number) {
    let balances: { value: number, name: string }[] = [];

    if (unlockedBalance) {
      balances.push({ name: this.ticker + ' Available', value: unlockedBalance});
    }
    if (vaultBalance) {
      balances.push({ name: this.ticker + ' in Vault', value: vaultBalance});
    }
    if (stakingBalance) {
      balances.push({ name: this.ticker + ' Staked', value: stakingBalance});
    }
    if (totalSupply) {
      const tmpTotal = totalSupply - (unlockedBalance + vaultBalance + stakingBalance);
      balances.push({ name: 'Total ' + this.ticker + ' Supply', value: tmpTotal });
    }
    this.chartMyBalanceItems = balances;
  }



  ellipsis(s: string) {
    return this._utils.ellipsis(s);
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

  getTotalBalances(balances: {balances: any, vault: any, stakes: any}): Record<string, ArwikiUserBalance> {
    const vault = balances.vault;
    const stakes = balances.stakes;
    const balance = balances.balances;
    const totalBalances: Record<string, ArwikiUserBalance> = {};
    let targets = [...Object.keys(balance), ...Object.keys(vault), ...Object.keys(stakes)];

    targets = targets.filter((v, i) => { return targets.indexOf(v) >= 0 });
    targets.forEach((t) => {
      const detail = this._arwikiTokenContract.getBalanceDetail(t, balance, vault, stakes);
      const total = detail.result.unlockedBalance + detail.result.vaultBalance + detail.result.stakingBalance;
      totalBalances[detail.result.target] = {
        address: detail.result.target,
        available: detail.result.unlockedBalance,
        vault: detail.result.vaultBalance,
        staked: detail.result.stakingBalance,
        totalBalance: total
      }
    });

    return totalBalances;    
  }
}
