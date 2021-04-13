import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { UserSettingsService } from '../core/user-settings.service';
import { ArwikiCategoriesContract } from '../arwiki-contracts/arwiki-categories';
import { ArwikiPagesContract } from '../arwiki-contracts/arwiki-pages';
import { switchMap, map } from 'rxjs/operators';
import { ArweaveService } from '../core/arweave.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss']
})
export class MainMenuComponent implements OnInit, OnDestroy {
	@Input() opened!: boolean;
	@Output() openedChange = new EventEmitter();
  routerLang: string = '';
  menuSubscription: Subscription = Subscription.EMPTY;
  loading: boolean = false;
  menu: any = {};
  categories: any;
  category_slugs: any;
  pages: any;
  defaultTheme: string = '';

  constructor(
      private _userSettings: UserSettingsService,
      private _categoriesContract: ArwikiCategoriesContract,
      private _pagesContract: ArwikiPagesContract,
      private _arweave: ArweaveService
    ) { }

  ngOnInit(): void {
    this.loading = true;

    this.getDefaultTheme();

    this._userSettings.routeLang$.subscribe((data) => {
      this.routerLang = data;
    });

    this.menuSubscription = this.getMenu().subscribe({
      next: (data) => {
        this.loading = false;
        this.category_slugs = Object.keys(data.categories);
        this.pages = data.pages;
        this.categories = data.categories;
        this.menu = {};

        for (let cats of this.category_slugs) {
          this.menu[cats] = [];
          if (this.pages && this.pages[cats]) {
            const pages_slugs = Object.keys(this.pages[cats]);
            for (let page_s of pages_slugs) {
              this.menu[cats].push(this.pages[cats][page_s]);
            }
          }
        }
        
      },
      error: (error) => {
        this.loading = false;
        alert('er' + error);
      }
    })
  }

  ngOnDestroy() {
    if (this.menuSubscription) {
      this.menuSubscription.unsubscribe();
    }
  }

  getDefaultTheme() {
    this.defaultTheme = this._userSettings.getDefaultTheme();
    this._userSettings.defaultThemeObservable$.subscribe(
      (theme) => {
        this.defaultTheme = theme;
      }
    );
  }

  toggleSideMenu() {
    this.opened = !this.opened;
    this.openedChange.emit(this.opened);
  }

  getMenu() {
    return this._categoriesContract.getState(this._arweave.arweave)
      .pipe(
        switchMap((categories) => {
          return this._pagesContract.getState(this._arweave.arweave)
            .pipe(
                map((pages) => {
                  return { categories: categories, pages: pages };
                })
              );
        })
      );
  }

  getSkeletonLoaderAnimationType() {
    let type = 'progress';
    if (this.defaultTheme === 'arwiki-dark') {
      type = 'progress-dark';
    }
    return type;
  }

  getSkeletonLoaderThemeNgStyle() {
    let ngStyle: any = {
      'height.px': '32',
      'width': '84%',
      'margin-top': '10px',
      'margin-left': '20px'
    };
    if (this.defaultTheme === 'arwiki-dark') {
      ngStyle['background-color'] = '#3d3d3d';
    }

    return ngStyle;
  }


}
