import { Injectable } from '@angular/core';
import { ArwikiTokenContract } from './arwiki-token.service';
import { WarpContractsService } from '../warp-contracts.service';
import { switchMap, of } from 'rxjs';
import { ArwikiCategoryIndex } from '../interfaces/arwiki-category-index';
import { ArwikiPageIndex } from '../interfaces/arwiki-page-index';
import { ArwikiPage } from '../interfaces/arwiki-page';
import { ArwikiMenuCategory } from '../interfaces/arwiki-menu-category';
import { ArwikiCategoriesService } from './arwiki-categories.service';
import { ArwikiQuery } from '../arwiki-query';
import { ArweaveService } from '../arweave.service';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';
import { ArwikiPagesService } from './arwiki-pages.service';
import { ArwikiCategory } from '../interfaces/arwiki-category';
import { UtilsService } from '../utils.service';

@Injectable({
  providedIn: 'root'
})
export class ArwikiMenuService {

  constructor(
    private _arwikiToken: ArwikiTokenContract,
    private _warp: WarpContractsService,
    private _arwikiCategories: ArwikiCategoriesService,
    private _arweave: ArweaveService,
    private _arwikiPages: ArwikiPagesService,
    private _utils: UtilsService) { }

  /*
  * @dev
  */
  getMainMenu(
    _langCode: string,
    _onlyShowInMenuOptions=true,
    _onlyActiveCategories=true,
    _onlyActivePages=true,
    _reload=false
  ) {
    const arwikiQuery: ArwikiQuery = new ArwikiQuery(this._arweave.arweave);
    let globalCat: ArwikiCategoryIndex = {};
    let globalPages: ArwikiPageIndex = {};

    return this._arwikiCategories.getCategories(
      _langCode,
      _onlyActiveCategories,
      _reload
    ).pipe(
        switchMap((_categories: ArwikiCategoryIndex) => {
          globalCat = _categories;
          return this._arwikiPages.getApprovedPagesByCategory(
            _langCode,
            Object.keys(_categories),
            _onlyActivePages
          );
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

          return arwikiQuery.getTXsData(verifiedPages);
        }),
        switchMap((txs: ArdbTransaction[]|ArdbBlock[]) => {
          const finalRes: Record<string, ArwikiPage[]> = {};
          for (let p of txs) {
            const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave); 
            const title = arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
            const id = pTX.id;
            const tmpSlug = Object.keys(globalPages).find((s) => {
              return globalPages[s].id === id;
            });
            const slug = tmpSlug ? tmpSlug : '';
            const category = globalPages[slug].category;
            const order = globalPages[slug].order;

            if (!globalPages[slug].showInMenu && _onlyShowInMenuOptions) {
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
    // Sort
    tmpMenu.sort((subCat1, subCat2) => {
      return categories[subCat2.category_slug].label.localeCompare(
        categories[subCat1.category_slug].label
      );
    }).sort((subCat1, subCat2) => {
      return (
          categories[subCat2.category_slug].order
        - categories[subCat1.category_slug].order
      );
    });

    return tmpMenu;
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
    // Sort
    subcategories.sort((subCat1, subCat2) => {
      return categories[subCat2.category_slug].label.localeCompare(
        categories[subCat1.category_slug].label
      );
    }).sort((subCat1, subCat2) => {
      return (
          categories[subCat2.category_slug].order
        - categories[subCat1.category_slug].order
      );
    });

    return subcategories;
  }

  flatMenu(
    tmpMenu: ArwikiMenuCategory[],
    categories: ArwikiCategoryIndex): ArwikiCategory[] {
    const menu = this._utils.cloneObject(tmpMenu);
    const finalMenu: ArwikiCategory[] = [];
    if (menu.length === 0) {
      return [];
    }
    menu.reverse();
    const numCats = menu.length;
    for (let i = 0; i < numCats; i++) {
      const children = menu[i].subcategories;
      finalMenu.push(categories[menu[i].category_slug]);
      if (children && children.length) {
        finalMenu.push(...this.flatMenu(children, categories));
      }
    }

    return finalMenu;
  }

  /*
  * @dev
  */
  getMainMenuOnlyCategories(
    _langCode: string,
    _onlyActiveCategories=true,
    _reload=false
  ) {
    return this._arwikiCategories.getCategories(
      _langCode,
      _onlyActiveCategories,
      _reload
    ).pipe(
      switchMap((_categories: ArwikiCategoryIndex) => {
        return of({ categories: _categories });
      }),
    );
  }

}
