import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';
import { Subscription } from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';

interface UserBalance {
  address: string;
  totalBalance: number;
  available: number;
  vault: number;
  staked: number;
}

@Component({
  selector: 'app-community-members',
  templateUrl: './community-members.component.html',
  styleUrls: ['./community-members.component.scss']
})
export class CommunityMembersComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['address', 'available', 'vault', 'staked', 'totalBalance'];
  dataSource!: MatTableDataSource<UserBalance>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @Input('lang') routeLang = '';
  dataSubscription = Subscription.EMPTY;

  constructor(
    private _arwikiTokenContract: ArwikiTokenContract,
    private _snackBar: MatSnackBar) {
    const totalBalances: Record<string, UserBalance> = this.getTotalBalances();
    const data = Object.values(totalBalances);
    data.sort((a, b) => {
      return b.totalBalance - a.totalBalance;
    });
    this.dataSource = new MatTableDataSource(data);
  }

  getTotalBalances(): Record<string, UserBalance> {
    const balances = this._arwikiTokenContract.getBalancesFromLocal();
    const vault = balances.vault;
    const stakes = balances.stakes;
    const balance = balances.balances;
    const totalBalances: Record<string, UserBalance> = {};
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

  ngOnInit(): void {
    
    
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
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

}
