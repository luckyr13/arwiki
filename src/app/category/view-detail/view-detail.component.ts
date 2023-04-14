import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ArweaveService } from '../../core/arweave.service';
import { Subscription, of, Observable } from 'rxjs';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';
import { UtilsService } from '../../core/utils.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from 'rxjs/operators';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { ArwikiPageIndex } from '../../core/interfaces/arwiki-page-index';
import { UserSettingsService } from '../../core/user-settings.service';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';
import {PageEvent} from '@angular/material/paginator';
import { ArwikiCategoryIndex } from '../../core/interfaces/arwiki-category-index';
import { ArwikiCategoriesService } from '../../core/arwiki-contracts/arwiki-categories.service';
import { ArwikiPagesService } from '../../core/arwiki-contracts/arwiki-pages.service';
import { ArwikiMenuService } from '../../core/arwiki-contracts/arwiki-menu.service';

@Component({
  templateUrl: './view-detail.component.html',
  styleUrls: ['./view-detail.component.scss']
})
export class ViewDetailComponent implements OnInit {
  arwikiQuery!: ArwikiQuery;
  pagesSubscription: Subscription = Subscription.EMPTY;
  loadingPages: boolean = false;
  category: string = '';
  pages: ArwikiPage[] = [];
  routeLang: string = '';
  baseURL: string = this._arweave.baseURL;
  defaultTheme: string = '';
  errorLoadingCategory: boolean = false;
  paginatorLength = 0;
  paginatorPageSize = 4;
  paginatorPageIndex = 0;
  paginatorPageSizeOptions = [4, 12, 24];
  categories: ArwikiCategoryIndex = {};
  childrenCategories: string[] = [];
  parentCategories: string[] = [];

  constructor(
  	private _arweave: ArweaveService,
  	private _arwikiTokenContract: ArwikiTokenContract,
  	private _utils: UtilsService,
  	private _route: ActivatedRoute,
    private _location: Location,
    private _userSettings: UserSettingsService,
    private _arwikiCategories: ArwikiCategoriesService,
    private _arwikiPages: ArwikiPagesService,
    private _arwikiMenu: ArwikiMenuService
 	) { }

  async ngOnInit() {
    // Init ardb instance
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
  	this.category = this._route.snapshot.paramMap.get('category')!;
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;
    this.getDefaultTheme();

    this._route.paramMap.subscribe(params => {
      this.routeLang = params.get('lang')!;
      this.category = params.get('category')!;
      this._loadContent();
    });

  }


  private _loadContent() {
    this.loadingPages = true;
    let networkInfo;
    let maxHeight = 0;
    this.paginatorPageIndex = 0;
    this.errorLoadingCategory = false;
    
    this.pagesSubscription = this.getPagesByCategory(
      this.category,
      this.routeLang
    ).subscribe({
      next: (finalRes: ArwikiPage[]) => {
        this.pages = finalRes;
        this.loadingPages = false;
        this.paginatorLength = this.pages ? this.pages.length : 0;
      },
      error: (error: string) => {
        this._utils.message(error, 'error');
        this.loadingPages = false;
        this.errorLoadingCategory = true;
      }
    });
  }

  slugToLabel(_s: string) {
  	return _s.replace(/_/gi, " ");
  }

  ngOnDestroy() {
		this.pagesSubscription.unsubscribe();

  }

  goBack() {
    this._location.back();
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


  getDefaultTheme() {
    this.defaultTheme = this._userSettings.getDefaultTheme();
    this._userSettings.defaultThemeStream.subscribe(
      (theme) => {
        this.defaultTheme = theme;
      }
    );
  }

  validateObj(_obj: object) {
    return !!Object.keys(_obj).length;
  }

  paginatorEvent(e: PageEvent) {
    this.paginatorPageSize = e.pageSize;
    this.paginatorPageIndex = e.pageIndex;
  }

  paginatedResults(): ArwikiPage[] {
    const start = this.paginatorPageIndex * this.paginatorPageSize ;
    const end = this.paginatorPageIndex * this.paginatorPageSize + this.paginatorPageSize;
    const res = this.pages.slice(start, end);
    return res;
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

}
