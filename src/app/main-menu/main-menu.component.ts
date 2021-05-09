import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { UserSettingsService } from '../core/user-settings.service';
import { switchMap, map } from 'rxjs/operators';
import { ArweaveService } from '../core/arweave.service';
import { Observable, Subscription, of } from 'rxjs';
import { ArwikiQuery } from '../core/arwiki-query';
import { ArwikiCategoriesContract } from '../core/arwiki-contracts/arwiki-categories';
import { ArwikiSettingsContract } from '../core/arwiki-contracts/arwiki-settings';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ArwikiCategoryIndex } from '../core/interfaces/arwiki-category-index';

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
  categories: ArwikiCategoryIndex = {};
  category_slugs: string[] = [];
  pages: any;
  defaultTheme: string = '';
  arwikiQuery!: ArwikiQuery;

  constructor(
      private _userSettings: UserSettingsService,
      private _arweave: ArweaveService,
      private _categoriesContract: ArwikiCategoriesContract,
      private _settingsContract: ArwikiSettingsContract,
      private _snackBar: MatSnackBar,
      private _router: Router
    ) { }

  async ngOnInit() {
    this.loading = true;
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);

    this.getDefaultTheme();

    this._userSettings.routeLangStream.subscribe(async (data) => {
      if (data != this.routerLang) {

        this.routerLang = data;
        if (this.routerLang) {

          this.loading = true;
          await this.getMenu();
        }  
      }
      
    });

  }

  async getMenu() {
    let networkInfo;
    let maxHeight = 0;
    try {
      networkInfo = await this._arweave.arweave.network.getInfo();
      maxHeight = networkInfo.height;
    } catch (error) {
      this.message(error, 'error');
      return;
    }
    this.menuSubscription = this.getMainMenu(
      this.routerLang,
      maxHeight
    ).subscribe({
      next: (data) => {
        this.loading = false;
        this.category_slugs = Object.keys(data.categories)
          .sort((f1: any, f2: any) => {
            if (data.categories[f1].order < data.categories[f2].order) {
              return -1;
            }
            if (data.categories[f1].order > data.categories[f2].order) {
              return 1;
            }
            // a must be equal to b
            return 0;
          });
       
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
        this.message(error, 'error');
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

  searchKeyNameInTags(_arr: any[], _key: string) {
    let res = '';
    for (const a of _arr) {
      if (a.name.toUpperCase() === _key.toUpperCase()) {
        return a.value;
      }
    }
    return res;
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

  isActiveRouteInCategory(_cat: string) {
    let isActive = false;

    for (let page of this.menu[_cat]) {
      const final = `${this.routerLang}/${page.slug}`;
      isActive = this._router.isActive(final, true);
      if (isActive) {
        break;
      }
    }

    return isActive;
  }


  /*
  * @dev
  */
  getMainMenu(
    _langCode: string,
    _maxHeight: number,
    _limit: number = 100
  ) {
    let _globalCat: ArwikiCategoryIndex = {};
    return this._categoriesContract.getState()
      .pipe(
        switchMap((categories: ArwikiCategoryIndex) => {
          _globalCat = categories;
          return this._settingsContract.getState();
        }),
        switchMap((settingsContractState) => {
          return (this.arwikiQuery.getVerifiedPagesByCategories(
              Object.keys(settingsContractState.admin_list),
              Object.keys(_globalCat),
              _langCode, 
              _limit,
              _maxHeight,
            )
          );
        }),
        switchMap((verifiedPages) => {
          const verifiedPagesList = [];
          for (let p of verifiedPages) {
            const vrfdPageId = this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Id');
            verifiedPagesList.push(vrfdPageId);
          }
          return this.arwikiQuery.getTXsData(verifiedPagesList);
        }),
        switchMap((txs) => {
          const finalRes: any = {};
          for (let p of txs) {
            const title = this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Title');
            const slug = this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug');
            const category = this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Category');
            const id = p.node.id;
            if (!Object.prototype.hasOwnProperty.call(finalRes, category)) {
              finalRes[category] = {};
            }
            
            finalRes[category][slug] = {
              title: title,
              slug: slug,
              category: category,
              id: id
            };
            
          }
          return of({ categories: _globalCat, pages: finalRes });
        })
      );
  }

}
