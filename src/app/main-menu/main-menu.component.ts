import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { UserSettingsService } from '../core/user-settings.service';
import { switchMap, map } from 'rxjs/operators';
import { Observable, Subscription, of } from 'rxjs';
import { UtilsService } from '../core/utils.service';
import { ArwikiCategoryIndex } from '../core/interfaces/arwiki-category-index';
import { ArwikiMenuCategory } from '../core/interfaces/arwiki-menu-category';
import { ArwikiMenuService } from '../core/arwiki-contracts/arwiki-menu.service';

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
  menu: ArwikiMenuCategory[] = [];
  categories: ArwikiCategoryIndex = {};
  defaultTheme: string = '';

  constructor(
      private _userSettings: UserSettingsService,
      private _utils: UtilsService,
      private _arwikiMenu: ArwikiMenuService
    ) { }

  async ngOnInit() {
    this.loading = true;

    this.getDefaultTheme();

    this._userSettings.routeLangStream.subscribe(async (data) => {
      if (data != this.routerLang) {
        this.routerLang = data;
        if (this.routerLang) {
          await this.getMenu();
        }  
      }
      
    });

  }

  getMenu() {
    this.loading = true;
    this.menu = [];
    this.menuSubscription = this._arwikiMenu.getMainMenu(
      this.routerLang
    ).subscribe({
      next: (data) => {
        this.loading = false;
        this.categories = data.categories;

        const pages = data.catPages;
        

        this.menu = this._arwikiMenu.generateMenu(
          {...this.categories},
          {...pages}
        );
        
      },
      error: (error) => {
        this.loading = false;
        this._utils.message(error, 'error');
      }
    })
  }

  ngOnDestroy() {
    this.menuSubscription.unsubscribe();
  }

  getDefaultTheme() {
    this.defaultTheme = this._userSettings.getDefaultTheme();
    this._userSettings.defaultThemeStream.subscribe(
      (theme) => {
        this.defaultTheme = theme;
      }
    );
  }

  toggleSideMenu() {
    this.opened = !this.opened;
    this.openedChange.emit(this.opened);
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
