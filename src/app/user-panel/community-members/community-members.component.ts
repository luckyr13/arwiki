import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
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
  dataSubscription = Subscription.EMPTY;

  constructor(
    private _arwikiTokenContract: ArwikiTokenContract,
    private _snackBar: MatSnackBar) {
    const totalBalances: Record<string, UserBalance> = this.getTotalBalances();
    this.dataSource = new MatTableDataSource(Object.values(totalBalances));
  }

  getTotalBalances(): Record<string, UserBalance> {
    const balances = this._arwikiTokenContract.getBalancesFromLocal();
    const vault = balances.vault;
    const stakes = balances.stakes;
    const balance = balances.balances;

    const totalBalances: Record<string, UserBalance> = {};
    // Vault
    for (const address in vault) {
      if (!Object.prototype.hasOwnProperty.call(totalBalances, address)) {
        totalBalances[address] = {
          address: address,
          totalBalance: 0,
          available: 0,
          vault: 0,
          staked: 0
        };
      }
      totalBalances[address].vault = 0;
      for (const v of vault[address]) {
        totalBalances[address].vault += v.balance;
      }
    }

    // Staked
    for (const address in stakes) {
      if (!Object.prototype.hasOwnProperty.call(totalBalances, address)) {
        totalBalances[address] = {
          address: address,
          totalBalance: 0,
          available: 0,
          vault: 0,
          staked: 0
        };
      }
      totalBalances[address].staked = 0;
      const sarr = Object.values(stakes[address]);

      sarr.forEach((s) => {
        const val = Object.values(s as Array<Record<string, number>>)[0];
        if (val) {
          totalBalances[address].staked += +val;
        }
      });
    }

    // Balances
    for (const address in balance) {
      if (!Object.prototype.hasOwnProperty.call(totalBalances, address)) {
        totalBalances[address] = {
          address: address,
          totalBalance: 0,
          available: 0,
          vault: 0,
          staked: 0
        };
      }
      totalBalances[address].available += balance[address];
    }

    // Total
    for (const address in totalBalances) {
      totalBalances[address].totalBalance = totalBalances[address].available
                                          + totalBalances[address].vault
                                          + totalBalances[address].staked;
    }


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
