import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';
import { Subscription } from 'rxjs';
import { ArwikiUserBalance } from '../../core/interfaces/arwiki-user-balance'

@Component({
  selector: 'app-community-members',
  templateUrl: './community-members.component.html',
  styleUrls: ['./community-members.component.scss']
})
export class CommunityMembersComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['address', 'available', 'vault', 'staked', 'totalBalance'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @Input('lang') routeLang = '';
  dataSubscription = Subscription.EMPTY;
  dataSource!: MatTableDataSource<ArwikiUserBalance>;
  @Input('balances') set balances(value: ArwikiUserBalance[]) {
    if (!this.dataSource) {
      this.dataSource = new MatTableDataSource<ArwikiUserBalance>(value);
    } else {
      this.dataSource.data = value;
    }
  }

  constructor(
    private _arwikiTokenContract: ArwikiTokenContract) {
    
  }

  ngOnInit() {
    
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

}
