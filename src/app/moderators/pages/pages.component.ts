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
import {
  DialogEditPagePropertiesComponent 
} from '../dialog-edit-page-properties/dialog-edit-page-properties.component';

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss']
})
export class PagesComponent implements OnInit, OnDestroy {
  loading = false;
  pagesSubscription = Subscription.EMPTY;
  displayedColumns: string[] = [
    'title', 'slug', 'order', 'showInMenu',
    'showInMainPage', 'showInFooter', 'nft', 'actions'
  ];
  category_slug = '';
  routeLang = '';
  categories: ArwikiCategoryIndex = {};
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
    const reload = true;
    this._loadContent(reload);
  }

  private _loadContent(reload: boolean) {
    this.loading = true;
    this.pages = [];
    this.categories = {};
    
    this.pagesSubscription = this.getPagesByCategory(
      this.category_slug,
      this.routeLang,
      reload
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
    _langCode: string,
    _reloadPages: boolean
  ): Observable<ArwikiPage[]> {
    let verifiedPages: string[] = [];
    let allApprovedPages: ArwikiPageIndex = {};
    const onlyActiveCategories = false;
    return this._arwikiCategories.getCategories(
      _langCode,
      onlyActiveCategories
    ).pipe(
        switchMap((categoriesContractState) => {
          this.categories = categoriesContractState;

          // Validate category 
          if (!(_category in categoriesContractState)) {
            throw new Error('Invalid category!');
          }

          return this._arwikiPages.getApprovedPages(
            _langCode,
            -1,
            _reloadPages
          );
        }),
        switchMap((_approvedPages: ArwikiPageIndex) => {
          allApprovedPages = _approvedPages;
          verifiedPages = Object.keys(_approvedPages)
            .filter((slug) => {
              return (_approvedPages[slug].category === _category);
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
            const showInMenu = allApprovedPages[slug].showInMenu;
            const showInMainPage = allApprovedPages[slug].showInMainPage;
            const showInFooter = allApprovedPages[slug].showInFooter;
            const nft = allApprovedPages[slug].nft;

            finalRes.push({
              title: title,
              slug: slug,
              category: category,
              img: img,
              id: id,
              language: this.routeLang,
              order: order,
              showInMenu: showInMenu,
              showInMainPage: showInMainPage,
              showInFooter: showInFooter,
              nft: nft,
              sponsor: sponsor
            });
          }

          // Lexicographical sort
          this._arwikiMenu.sortPages(finalRes);
          
          return of(finalRes);
        }),


      );
  }

  openEditPagePropertiesModal(slug: string, langCode: string) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';
    const page = this.pages.find((p) => {
      return p.slug === slug;
    });

    const dialogRef = this._dialog.open(DialogEditPagePropertiesComponent, {
      width: '650px',
      data: {
        langCode: langCode,
        page: page
      },
      direction: direction,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((tx: string) => {
      if (tx) {
        // Reload
        const reload = true;
        this._loadContent(reload);
      }
    });
  }

}
