import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { ArwikiCategory } from '../../core/interfaces/arwiki-category';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Direction } from '@angular/cdk/bidi';
import { UserSettingsService } from '../../core/user-settings.service';
import { ArwikiCategoriesService } from '../../core/arwiki-contracts/arwiki-categories.service';
import { ActivatedRoute } from '@angular/router';
import { ArwikiMenuService } from '../../core/arwiki-contracts/arwiki-menu.service';
import { UtilsService } from '../../core/utils.service';
import {
  DialogNewCategoryComponent 
} from '../dialog-new-category/dialog-new-category.component';

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
    'label', 'slug', 'parent', 'order', 'status', 'actions'
  ];
  dataSource: ArwikiCategory[] = [];
  routeLang: string = '';

  constructor(
    private _location: Location,
    private _dialog: MatDialog,
    private _userSettings: UserSettingsService,
    private _arwikiCategories: ArwikiCategoriesService,
    private _route: ActivatedRoute,
    private _arwikiMenu: ArwikiMenuService,
    private _utils: UtilsService) {

  }

  goBack() {
    this._location.back();
  }

  ngOnInit() {
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;
    const reload = true;
    this.loadCategoriesTable(reload);
  }

  loadCategoriesTable(reload: boolean) {
    this.loading = true;
    const langCode = this.routeLang;
    const onlyActive = false;

    this.dataSource = [];
    const onlyActiveCategories = false;
    this.categoriesSubscription = this._arwikiMenu.getMainMenuOnlyCategories(
      this.routeLang,
      onlyActiveCategories,
      reload
    ).subscribe({
      next: (data) => {
        this.loading = false;
        this.categories = data.categories;

        const menu = this._arwikiMenu.generateMenu(
          {...this.categories},
          {}
        );

        this.dataSource = this._arwikiMenu.flatMenu(menu, this.categories);

      },
      error: (error) => {
        this.loading = false;
        this._utils.message(error, 'error');
      }
    })

  }

  ngOnDestroy() {
    this.categoriesSubscription.unsubscribe();
  }

  openNewCategoryModal() {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogNewCategoryComponent, {
      width: '650px',
      data: {
        langCode: this.routeLang
      },
      direction: direction,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((tx: string) => {
      if (tx) {
        // Reload
        const reload = true;
        this.loadCategoriesTable(reload);
      }
    });
  }


}
