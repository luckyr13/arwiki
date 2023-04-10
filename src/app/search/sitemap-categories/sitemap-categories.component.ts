import { Component, OnInit, OnDestroy, Input, OnChanges } from '@angular/core';
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
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { Router } from '@angular/router';
import { ArwikiLangsService } from '../../core/arwiki-contracts/arwiki-langs.service';
import { ArwikiLang } from '../../core/interfaces/arwiki-lang';

@Component({
  selector: 'app-sitemap-categories',
  templateUrl: './sitemap-categories.component.html',
  styleUrls: ['./sitemap-categories.component.scss']
})
export class SitemapCategoriesComponent implements OnInit, OnDestroy, OnChanges {
  loading = false;
  categories: Record<string, ArwikiCategory> = {};
  categoriesSubscription = Subscription.EMPTY;
  displayedColumns: string[] = [
    'label', 'slug', 'parent', 'order', 'pages', 'status'
  ];
  dataSource: ArwikiCategory[] = [];
  @Input('routeLang') routeLang: string = '';
  categoriesPages: Record<string, ArwikiPage[]> = {};
  totalPages = 0;
  languagesSubscription = Subscription.EMPTY;
  selLanguage = '';
  languages: ArwikiLang[]  = [];

  constructor(
    private _location: Location,
    private _dialog: MatDialog,
    private _userSettings: UserSettingsService,
    private _arwikiCategories: ArwikiCategoriesService,
    private _route: ActivatedRoute,
    private _arwikiMenu: ArwikiMenuService,
    private _utils: UtilsService,
    private _router: Router,
    private _arwikiTokenLangs: ArwikiLangsService) {

  }

  goBack() {
    this._location.back();
  }

  ngOnInit() {
    
  }

  ngOnChanges() {
    const reload = true;
    this.loadCategoriesTable(reload);
    // Get langs
    this.getLanguages();
  }

  loadCategoriesTable(reload: boolean) {
    this.loading = true;
    const langCode = this.routeLang;
    const onlyActive = false;
    this.totalPages = 0;

    this.dataSource = [];
    const onlyShowInMenuOptions = false;
    const onlyActiveCategories = false;
    const onlyActivePages = false;
    this.categoriesSubscription = this._arwikiMenu.getMainMenu(
      this.routeLang,
      onlyShowInMenuOptions,
      onlyActiveCategories,
      onlyActivePages
    ).subscribe({
      next: (data) => {
        this.loading = false;
        this.categories = data.categories;

        const pages = data.catPages;
        this.categoriesPages = pages;
        
        const menu = this._arwikiMenu.generateMenu(
          {...this.categories},
          {...pages}
        );

        this.dataSource = this._arwikiMenu.flatMenu(menu, this.categories);

        for (const sl in this.categoriesPages) {
          this.totalPages += this.categoriesPages[sl].length;
        }

      },
      error: (error) => {
        this.loading = false;
        this._utils.message(error, 'error');
      }
    })

  }

  ngOnDestroy() {
    this.categoriesSubscription.unsubscribe();
    this.languagesSubscription.unsubscribe();
  }

  updateLang(lang: string) {
    this._router.navigate(['/', lang, 'search', 'sitemap']);
  }

  getLanguages() {
    const onlyActive = true;
    this.languagesSubscription = this._arwikiTokenLangs.getLanguages(
      onlyActive
    ).subscribe({
      next: (langs) => {
        this.languages = Object.values(langs);
        this.selLanguage = this.routeLang;
      },
      error: (error) => {
        this._utils.message('Error loading langs', 'error');
        console.error('getLanguages', error);
      }
    })
  }

}
