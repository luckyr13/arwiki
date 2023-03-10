import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { UserSettingsService } from '../core/user-settings.service';
import { switchMap, map } from 'rxjs/operators';
import { ArweaveService } from '../core/arweave.service';
import { Observable, Subscription, of } from 'rxjs';
import { ArwikiQuery } from '../core/arwiki-query';
import { ArwikiTokenContract } from '../core/arwiki-contracts/arwiki-token.service';
import { UtilsService } from '../core/utils.service';
import { ArwikiCategoryIndex } from '../core/interfaces/arwiki-category-index';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';
import { ArwikiPage } from '../core/interfaces/arwiki-page';
import { ArwikiPageIndex } from '../core/interfaces/arwiki-page-index';
import { ArwikiMenuCategory } from '../core/interfaces/arwiki-menu-category';

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
  arwikiQuery!: ArwikiQuery;

  constructor(
      private _userSettings: UserSettingsService,
      private _arweave: ArweaveService,
      private _arwikiTokenContract: ArwikiTokenContract,
      private _utils: UtilsService
    ) { }

  async ngOnInit() {
    this.loading = true;
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);

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

  generateMenuChildren(
    categories: ArwikiCategoryIndex,
    catPages: Record<string, ArwikiPage[]>,
    slugs: string[],
    numCategories: number,
    parent_id: string) {
    const subcategories: ArwikiMenuCategory[] = [];

    for (let i = 0; i < numCategories; i++) {
      if (categories[slugs[i]].parent_id === parent_id) {
        subcategories.push({
            category_slug: slugs[i],
            pages: catPages[slugs[i]],
            subcategories: this.generateMenuChildren(
              categories,
              catPages,
              slugs,
              numCategories,
              slugs[i])
          });
      }

    }

    return subcategories;
  }


  generateMenu(
    categories: ArwikiCategoryIndex,
    catPages: Record<string, ArwikiPage[]>) {
    const tmpMenu: ArwikiMenuCategory[] = [];
    const categoriesSlugs = Object.keys(categories);
    const numCategories = categoriesSlugs.length;
    for (let i = 0; i < numCategories; i++) {
      // Parents
      if (!categories[categoriesSlugs[i]].parent_id) {
        tmpMenu.push({
          category_slug: categoriesSlugs[i],
          pages: catPages[categoriesSlugs[i]],
          subcategories: this.generateMenuChildren(
            categories,
            catPages,
            categoriesSlugs,
            numCategories,
            categoriesSlugs[i])
          });
      }
    }

    return tmpMenu;
  }

  getMenu() {
    this.loading = true;
    this.menu = [];
    this.menuSubscription = this.getMainMenu(
      this.routerLang
    ).subscribe({
      next: (data) => {
        this.loading = false;
        this.categories = data.categories;

        const pages = data.catPages;
        

        this.menu = this.generateMenu(this.categories, pages);
        
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


  /*
  * @dev
  */
  getMainMenu(
    _langCode: string
  ) {
    let globalCat: ArwikiCategoryIndex = {};
    let globalPages: ArwikiPageIndex = {};

    return this._arwikiTokenContract.getCategories()
      .pipe(
        switchMap((_categories: ArwikiCategoryIndex) => {
          globalCat = _categories;
          return this._arwikiTokenContract.getApprovedPagesByCategory(_langCode, Object.keys(_categories));
        }),
        switchMap((_approvedPages) => {
          globalPages = _approvedPages;

          // Sort asc by block height
          //let verifiedPages = Array.prototype.sort.call(Object.keys(_approvedPages), (a, b) => {
          //  return _approvedPages[a].lastUpdateAt! - _approvedPages[b].lastUpdateAt!;
          //});
          let verifiedPages = Object.keys(_approvedPages);


          verifiedPages = verifiedPages.map((slug) => {
            return _approvedPages[slug].id!;
          });

          return this.arwikiQuery.getTXsData(verifiedPages);
        }),
        switchMap((txs: ArdbTransaction[]|ArdbBlock[]) => {
          const finalRes: Record<string, ArwikiPage[]> = {};
          for (let p of txs) {
            const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave); 
            const title = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
            const id = pTX.id;
            const tmpSlug = Object.keys(globalPages).find((s) => {
              return globalPages[s].id === id;
            });
            const slug = tmpSlug ? tmpSlug : '';
            const category = globalPages[slug].category;
            const order = globalPages[slug].order;

            if (!globalPages[slug].showInMenu) {
              continue;
            }

            if (!Object.prototype.hasOwnProperty.call(finalRes, category)) {
              finalRes[category] = [];
            }

            
            finalRes[category].push({
              title: title,
              slug: slug,
              category: category,
              id: id,
              language: _langCode,
              order: order
            });
          }

          // Lexicographical sort
          for (let cat in finalRes) {
            Array.prototype.sort.call(finalRes[cat], (a, b) => {
              return a.title.localeCompare(b.title);
            });
          }

          // Sort by order
          for (let cat in finalRes) {
            Array.prototype.sort.call(finalRes[cat], (a, b) => {
              return a.order - b.order;
            });
          }
          

          return of({ categories: globalCat, catPages: finalRes });
        })
      );
  }

}
