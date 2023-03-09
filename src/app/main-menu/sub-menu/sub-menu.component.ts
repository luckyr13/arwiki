import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ArwikiCategoryIndex } from '../../core/interfaces/arwiki-category-index';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { Router } from '@angular/router';
import { ArwikiMenuCategory } from '../../core/interfaces/arwiki-menu-category';

@Component({
  selector: 'app-sub-menu',
  templateUrl: './sub-menu.component.html',
  styleUrls: ['./sub-menu.component.scss']
})
export class SubMenuComponent implements OnInit {
  @Input('categories') categories: ArwikiCategoryIndex = {};
  @Input('routerLang') routerLang = '';
  @Input() opened!: boolean;
  @Output() openedChange = new EventEmitter();
  @Input('menu') menu: ArwikiMenuCategory[] = [];
  @Input('level') level = 0;

  constructor(private _router: Router) {

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


  toggleSideMenu() {
    this.opened = !this.opened;
    this.openedChange.emit(this.opened);
  }

  isActiveRouteInCategory(_cat: string) {
    let isActive = false;

    for (let menuOption of this.menu) {
      const pages = menuOption.pages;
      const numPages = pages && pages.length ? pages.length : 0;
      for (let i = 0; i < numPages; i++) {
        const final = `${this.routerLang}/${menuOption.pages[i].slug}`;
        isActive = this._router.isActive(final, true);
        if (isActive) {
          break;
        }
      }
    }

    return isActive;
  }

  leftPadding() {
    const newPadding = 12 * this.level;
    return `${newPadding}px`;
  }
}
