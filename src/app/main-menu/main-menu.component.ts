import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { UserSettingsService } from '../auth/user-settings.service';
import { ArwikiCategoriesContract } from '../arwiki-contracts/arwiki-categories';
import { ArwikiPagesContract } from '../arwiki-contracts/arwiki-pages';
import { switchMap, map } from 'rxjs/operators';
import { ArweaveService } from '../auth/arweave.service';
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

  constructor(
      private _userSettings: UserSettingsService,
      private _categoriesContract: ArwikiCategoriesContract,
      private _pagesContract: ArwikiPagesContract,
      private _arweave: ArweaveService
    ) { }

  ngOnInit(): void {
    this.loading = true;

    this._userSettings.routeLang$.subscribe((data) => {
      this.routerLang = data;
    });

    this.menuSubscription = this.getMenu().subscribe({
      next: (data) => {
        this.loading = false;
        this.category_slugs = Object.keys(data.categories.categories);
        this.pages = data.pages.pages;
        this.categories = data.categories.categories;

        for (let cats of this.category_slugs) {
          this.menu[cats] = [];
        }
        for (let page of this.pages) {
          this.menu[page.categories[0]].push(page);
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


}
