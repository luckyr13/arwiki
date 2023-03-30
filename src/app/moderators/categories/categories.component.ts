import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { ArwikiCategory } from '../../core/interfaces/arwiki-category';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Direction } from '@angular/cdk/bidi';
import { UserSettingsService } from '../../core/user-settings.service';
import { ArwikiCategoriesService } from '../../core/arwiki-contracts/arwiki-categories.service';
import { ActivatedRoute } from '@angular/router';

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
  routeLang: string = '';

  constructor(
    private _location: Location,
    private _dialog: MatDialog,
    private _userSettings: UserSettingsService,
    private _arwikiCategories: ArwikiCategoriesService,
    private _route: ActivatedRoute,) {

  }

  goBack() {
    this._location.back();
  }

  ngOnInit() {
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;
    const reload = true;
    const onlyActive = false;
    this.loadCategoriesTable(this.routeLang, onlyActive, reload);
  }

  loadCategoriesTable(
    langCode: string,
    onlyActive: boolean,
    reload: boolean) {
    this.loading = true;
    this.categoriesSubscription = this._arwikiCategories.getCategories(
        langCode, onlyActive, reload
      ).subscribe({
        next: (langs) => {
          this.categories = langs;
          this.dataSource = Object.values(this.categories);
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          console.error('ErrorLang:', error);
        }
      });

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
