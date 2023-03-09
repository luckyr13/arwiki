import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { ArwikiCategoryIndex } from '../../core/interfaces/arwiki-category-index';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { Router } from '@angular/router';
import { ArwikiMenuCategory } from '../../core/interfaces/arwiki-menu-category';
import {TranslateService} from '@ngx-translate/core';
import { Subscription, of, startWith, delay } from 'rxjs';

@Component({
  selector: 'app-sub-menu',
  templateUrl: './sub-menu.component.html',
  styleUrls: ['./sub-menu.component.scss']
})
export class SubMenuComponent implements OnInit, OnDestroy {
  @Input('categories') categories: ArwikiCategoryIndex = {};
  @Input('routerLang') routerLang = '';
  @Input() opened!: boolean;
  @Output() openedChange = new EventEmitter();
  
  @Input('menu') menu: ArwikiMenuCategory[] = [];
  @Input('level') level = 0;
  translations: Record<string, string> = {};
  subscriptionTranslation = Subscription.EMPTY;
  expanded = false;
  activeRouteExpanded: Record<string, boolean> = {};

  constructor(
    private _router: Router,
    private _translate: TranslateService) {

  }


  ngOnInit() {
    // Lexicographical order
    Array.prototype.sort.call(this.menu, (a, b) => {
      return this.categories[a.category_slug].label.localeCompare(
        this.categories[b.category_slug].label
      );
    });

    // Sort by order
    Array.prototype.sort.call(this.menu, (a, b) => {
      return this.categories[a.category_slug].order - this.categories[b.category_slug].order;
    });

    // Load menu translations
    for (let menuOption of this.menu) {
      const tkey = 'MAIN_MENU.' + menuOption.category_slug;
      this.subscriptionTranslation = this._translate.get(tkey).subscribe({
        next: (res) => {
          if (res !== tkey) {
            this.translations[tkey] = res;
          } else {
            this.translations[tkey] = this.categories[menuOption.category_slug].label;
          }
        },
        error: () => {
          console.error('Error loading translations!');
        }
      })
    }

    // Check active route
    for (let menuOption of this.menu) {
      const pages = menuOption.pages;
      let isActive = false;
      const numPages = pages && pages.length ? pages.length : 0;
      for (let i = 0; i < numPages; i++) {
        const final = `${this.routerLang}/${encodeURIComponent(menuOption.pages[i].slug)}`;
        isActive = this._router.isActive(final, true);
        if (isActive) {
          this.activeRouteExpanded[menuOption.category_slug] = isActive;
          break;
        }
      }
    }

  }

  ngOnDestroy() {
    this.subscriptionTranslation.unsubscribe();
  }


  toggleSideMenu() {
    this.opened = !this.opened;
    this.openedChange.emit(this.opened);
  }


  leftPadding() {
    const newPadding = 12 * this.level;
    return `${newPadding}px`;
  }
}
