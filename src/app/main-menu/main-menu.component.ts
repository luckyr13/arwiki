import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { UserSettingsService } from '../core/user-settings.service';
import { ArwikiCategoriesContract } from '../arwiki-contracts/arwiki-categories';
import { ArwikiSettingsContract } from '../arwiki-contracts/arwiki-settings';
import { switchMap, map } from 'rxjs/operators';
import { ArweaveService } from '../core/arweave.service';
import { Observable, Subscription, of } from 'rxjs';
import ArDB from 'ardb';

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
  ardb: ArDB|null = null;

  constructor(
      private _userSettings: UserSettingsService,
      private _categoriesContract: ArwikiCategoriesContract,
      private _arweave: ArweaveService,
      private _settingsContract: ArwikiSettingsContract
    ) { }

  ngOnInit(): void {
    this.loading = true;
    this.ardb = new ArDB(this._arweave.arweave);

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
    let _globalCat: any = {};
    return this._categoriesContract.getState(this._arweave.arweave)
      .pipe(
        switchMap((categories) => {
          _globalCat = categories;
          return this._settingsContract.getState(this._arweave.arweave);
        }),
        switchMap((settingsContractState) => {
          return this.getVerifiedPages(settingsContractState.adminList);
        }),
        switchMap((verifiedPages) => {
          const verifiedPagesList = [];
          for (let p of verifiedPages) {
            const vrfdPageId = this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Id');
            verifiedPagesList.push(vrfdPageId);
          }
          return this.getTXsData(verifiedPagesList);
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

  searchKeyNameInTags(_arr: any[], _key: string) {
    let res = '';
    for (const a of _arr) {
      if (a.name.toUpperCase() === _key.toUpperCase()) {
        return a.value;
      }
    }
    return res;
  }

  /*
  * @dev
  */
  getVerifiedPages(owners: string[]): Observable<any> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['Validation'],
      },
    ];

    const obs = new Observable((subscriber) => {
      this.ardb!.search('transactions')
        .limit(20)
        .from(owners)
        .tags(tags).find().then((res) => {
          subscriber.next(res);
          subscriber.complete();
        })
        .catch((error) => {
          subscriber.error(error);
        });

    });
    return obs;
  }

  /*
  * @dev
  */
  getTXsData(transactions: string[]): Observable<any> {
    
    const obs = new Observable((subscriber) => {
      this.ardb!.search('transactions')
        .ids(transactions).find().then((res) => {
          subscriber.next(res);
          subscriber.complete();
        })
        .catch((error) => {
          subscriber.error(error);
        });

    });
    return obs;
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
