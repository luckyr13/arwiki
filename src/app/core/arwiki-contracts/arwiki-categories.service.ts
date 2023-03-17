import { Injectable } from '@angular/core';
import { ArwikiTokenContract } from './arwiki-token.service';
import { WarpContractsService } from '../warp-contracts.service';
import { JWKInterface } from 'arweave/web/lib/wallet';
import { Observable, map } from 'rxjs';
import { ArwikiCategoryIndex } from '../interfaces/arwiki-category-index';

@Injectable({
  providedIn: 'root'
})
export class ArwikiCategoriesService {

  constructor(
    private _arwikiToken: ArwikiTokenContract,
    private _warp: WarpContractsService) { }

  /*
  *  @dev Get active Categories
  */
  getCategories(onlyActive=true, reload=false): Observable<ArwikiCategoryIndex> {
    return this._arwikiToken.getState(reload).pipe(
      map((_state: any) => {
        const categories: ArwikiCategoryIndex = Object
          .keys(_state.categories)
          .reduce((accum: ArwikiCategoryIndex, slug)=> {
              if (_state.categories[slug].active && onlyActive) {
                accum[slug] = {..._state.categories[slug]};
                accum[slug].slug = slug;
              } else {
                accum[slug] = {..._state.categories[slug]};
                accum[slug].slug = slug;
              }
              return accum;
            }, {});
        return categories;
      })
    );
  }

  /*
  *  @dev Get Categories
  */
  getCategoriesFromLocal(): ArwikiCategoryIndex {
    const state = this._arwikiToken.getStateFromLocal();
    return {...state.categories};
  }

}
