import { Injectable } from '@angular/core';
import { ArwikiTokenContract } from './arwiki-token.service';
import { WarpContractsService } from '../warp-contracts.service';
import { JWKInterface } from 'arweave/web/lib/wallet';
import { Observable, map } from 'rxjs';
import { ArwikiCategoryIndex } from '../interfaces/arwiki-category-index';
import { UtilsService } from '../utils.service';

@Injectable({
  providedIn: 'root'
})
export class ArwikiCategoriesService {

  constructor(
    private _arwikiToken: ArwikiTokenContract,
    private _warp: WarpContractsService,
    private _utils: UtilsService) { }

  /*
  *  @dev Get active Categories
  */
  getCategories(
    lang: string,
    onlyActive=true,
    reload=false): Observable<ArwikiCategoryIndex> {
    return this._arwikiToken.getState(reload).pipe(
      map((_state: any) => {
        if (!Object.prototype.hasOwnProperty.call(
            _state.categories, lang
           )) {
          return {};
        }
        const categories: ArwikiCategoryIndex = Object
          .keys(_state.categories[lang])
          .reduce((accum: ArwikiCategoryIndex, slug)=> {
              if (_state.categories[lang][slug].active && onlyActive) {
                accum[slug] = {...this._utils.cloneObject(_state.categories[lang][slug])};
                accum[slug].slug = slug;
              } else if (!onlyActive) {
                accum[slug] = {...this._utils.cloneObject(_state.categories[lang][slug])};
                accum[slug].slug = slug;
              }
              return accum;
            }, {});
        return categories;
      })
    );
  }

}
