import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { MatDialog } from '@angular/material/dialog';
import { Direction } from '@angular/cdk/bidi';
import { UserSettingsService } from '../../core/user-settings.service';
import { ActivatedRoute } from '@angular/router';
import { ArwikiPageIndex } from '../../core/interfaces/arwiki-page-index';
import { ArwikiCategoriesService } from '../../core/arwiki-contracts/arwiki-categories.service';
import { ArwikiPagesService } from '../../core/arwiki-contracts/arwiki-pages.service';
import { ArwikiMenuService } from '../../core/arwiki-contracts/arwiki-menu.service';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ArwikiCategoryIndex } from '../../core/interfaces/arwiki-category-index';
import { ArweaveService } from '../../core/arweave.service';
import { Subscription, of, Observable, switchMap } from 'rxjs';
import ArdbTransaction from 'ardb/lib/models/transaction';
import ArdbBlock from 'ardb/lib/models/block';
import { UtilsService } from '../../core/utils.service';

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss']
})
export class PagesComponent implements OnInit, OnDestroy {
  loading = false;
  pagesSubscription = Subscription.EMPTY;
  displayedColumns: string[] = [
    'title', 'slug', 'order', 'actions'
  ];
  category_slug = '';
  routeLang = '';
  categories: ArwikiCategoryIndex = {};
  childrenCategories: string[] = [];
  parentCategories: string[] = [];
  arwikiQuery!: ArwikiQuery;
  pages: ArwikiPage[] = [];

  constructor(
    private _location: Location,
    private _dialog: MatDialog,
    private _userSettings: UserSettingsService,
    private _route: ActivatedRoute,
    private _arwikiCategories: ArwikiCategoriesService,
    private _arwikiPages: ArwikiPagesService,
    private _arwikiMenu: ArwikiMenuService,
    private _arweave: ArweaveService,
    private _utils: UtilsService) {

  }

  goBack() {
    this._location.back();
  }

  ngOnInit() {
    // Init ardb instance
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;
    this.category_slug = this._route.snapshot.paramMap.get('slug')!;
    
    this._loadContent();
  }

  private _loadContent() {
    this.loading = true;
    
    this.pagesSubscription = this.getPagesByCategory(
      this.category_slug,
      this.routeLang
    ).subscribe({
      next: (finalRes: ArwikiPage[]) => {
        this.pages = finalRes;
        this.loading = false;
      },
      error: (error: string) => {
        this._utils.message(error, 'error');
        this.loading = false;
      }
    });
  }

  ngOnDestroy() {
    this.pagesSubscription.unsubscribe();
  }

  /*
  * @dev
  */
  getPagesByCategory(
    _category: string,
    _langCode: string
  ): Observable<ArwikiPage[]> {
    let verifiedPages: string[] = [];
    let allApprovedPages: ArwikiPageIndex = {};
    return this._arwikiCategories.getCategories(_langCode)
      .pipe(
        switchMap((categoriesContractState) => {
          this.categories = categoriesContractState;

          // Validate category 
          if (!(_category in categoriesContractState)) {
            throw new Error('Invalid category!');
          }

          this.childrenCategories = this.getChildrenCategories(_category);
          this.parentCategories = this.getParentCategories(_category);

          return this._arwikiPages.getApprovedPages(
            _langCode,
            -1
          );
        }),
        switchMap((_approvedPages: ArwikiPageIndex) => {
          allApprovedPages = _approvedPages;
          const allChildrenCategories = this.getAllChildrenCategories(_category);
          verifiedPages = Object.keys(_approvedPages)
            .filter((slug) => {
              return (_approvedPages[slug].category === _category ||
                  allChildrenCategories.indexOf(_approvedPages[slug].category) >= 0);
            }).map((slug) => {
              return _approvedPages[slug].id!;
            })
          return this.arwikiQuery.getTXsData(verifiedPages);
        }),
        switchMap((_pages: ArdbTransaction[]|ArdbBlock[]) => {
          const finalRes: ArwikiPage[] = [];
          for (let p of _pages) {
            const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
            const title = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
            const img = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img');
            const owner = pTX.owner.address;
            const id = pTX.id;
            const tmpSlug = Object.keys(allApprovedPages).find((s) => {
              return allApprovedPages[s].id === id;
            });
            const slug = tmpSlug ? tmpSlug : '';
            const category = allApprovedPages[slug].category;
            const order = allApprovedPages[slug].order;
            const sponsor = allApprovedPages[slug].sponsor;

            finalRes.push({
              title: title,
              slug: slug,
              category: category,
              img: img,
              id: id,
              language: this.routeLang,
              order: order
            });
          }

          // Lexicographical sort
          this._arwikiMenu.sortPages(finalRes);
          
          return of(finalRes);
        }),


      );
  }

  getChildrenCategories(cat_slug: string) {
    const catSlugs = Object.keys(this.categories);
    const children: string[] = [];
    for (let cat of catSlugs) {
      if (this.categories[cat].parent_id === cat_slug) {
        children.push(cat);
      }
    }
    return children;
  }

  getParentCategories(cat_slug: string) {
    const parents: string[] = [];
    let newParent = this.findParentCat(cat_slug);
    while(newParent) {
      parents.push(newParent);
      newParent = this.findParentCat(newParent);
    }
    parents.reverse();
    return parents;
  }

  getAllChildrenCategories(cat_slug: string) {
    const catSlugs = Object.keys(this.categories);
    const children: string[] = [];
    for (let cat of catSlugs) {
      if (this.categories[cat].parent_id === cat_slug) {
        children.push(cat);
        const newChildren = this.getAllChildrenCategories(this.categories[cat].slug);
        if (newChildren && newChildren.length) {
          children.push(...newChildren);
        }
      }
    }
    return children;
  }

  findParentCat(cat_slug: string) {
    return this.categories[cat_slug].parent_id;
  }
}
