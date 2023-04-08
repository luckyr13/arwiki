import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { ArwikiCategoryIndex } from '../../core/interfaces/arwiki-category-index';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { Router } from '@angular/router';
import { ArwikiMenuCategory } from '../../core/interfaces/arwiki-menu-category';
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

  constructor(
    private _router: Router) {

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

  }

  ngOnDestroy() {
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
