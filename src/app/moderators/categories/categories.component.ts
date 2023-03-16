import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { ArwikiCategory } from '../../core/interfaces/arwiki-category';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Direction } from '@angular/cdk/bidi';
import { UserSettingsService } from '../../core/user-settings.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit, OnDestroy {
  loading = false;
  categories: Record<string, ArwikiCategory> = {};
  categoriesSubscription = Subscription.EMPTY;
  displayedColumns: string[] = [
    'slug'
  ];
  dataSource: ArwikiCategory[] = [];

  constructor(
    private _location: Location,
    private _dialog: MatDialog,
    private _userSettings: UserSettingsService) {

  }

  goBack() {
    this._location.back();
  }

  ngOnInit() {
    this.loadCategoriesTable(false);
  }

  loadCategoriesTable(reload: boolean) {
    // this.loading = true;

  }

  ngOnDestroy() {
    this.categoriesSubscription.unsubscribe();
  }

  openNewCategoryModal() {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';
    
  }


}
