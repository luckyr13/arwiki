import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { ArwikiCategoryIndex } from '../../core/interfaces/arwiki-category-index';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { Router } from '@angular/router';
import { ArwikiMenuCategory } from '../../core/interfaces/arwiki-menu-category';
import {TranslateService} from '@ngx-translate/core';
import { Subscription, of, startWith, delay } from 'rxjs';

@Component({
  selector: 'app-sub-menu-mainpage',
  templateUrl: './sub-menu-main-page.component.html',
  styleUrls: ['./sub-menu-main-page.component.scss']
})
export class SubMenuMainPageComponent implements OnInit, OnDestroy {
  @Input('categories') categories: ArwikiCategoryIndex = {};
  @Input('routerLang') routerLang = '';
  
  @Input('menu') menu: ArwikiMenuCategory[] = [];
  @Input('level') level = 0;
  translations: Record<string, string> = {};
  subscriptionTranslation = Subscription.EMPTY;

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

  }

  ngOnDestroy() {
    this.subscriptionTranslation.unsubscribe();
  }

  leftPadding() {
    const newPadding = 6 * this.level;
    return `${newPadding}px`;
  }

  leftPaddingPage() {
    const newPadding = 12 * (this.level + 1);
    return `${newPadding}px`;
  }
}
