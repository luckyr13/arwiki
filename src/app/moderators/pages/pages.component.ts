import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Direction } from '@angular/cdk/bidi';
import { UserSettingsService } from '../../core/user-settings.service';

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss']
})
export class PagesComponent implements OnInit, OnDestroy {
  loading = false;
  pages: Record<string, ArwikiPage> = {};
  pagesSubscription = Subscription.EMPTY;
  displayedColumns: string[] = [
    'slug'
  ];
  dataSource: ArwikiPage[] = [];

  constructor(
    private _location: Location,
    private _dialog: MatDialog,
    private _userSettings: UserSettingsService) {

  }

  goBack() {
    this._location.back();
  }

  ngOnInit() {
    this.loadPagesTable(false);
  }

  loadPagesTable(reload: boolean) {
    // this.loading = true;

  }

  ngOnDestroy() {
    this.pagesSubscription.unsubscribe();
  }


}
