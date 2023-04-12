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

  addCategory(
    _label: string,
    _slug: string,
    _parent: string,
    _order: number,
    _languageCode: string,
    _privateKey: JWKInterface|'use_wallet',
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'AddCategory'},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'addCategory',
      langCode: _languageCode,
      label: _label,
      slug: _slug,
      parent: _parent,
      order: _order
    };
    
    return this._warp.writeInteraction(
      this._arwikiToken.contractAddress, jwk, input, tags
    );
  }

  updateCategory(
    _label: string,
    _slug: string,
    _parent: string,
    _order: number,
    _active: boolean,
    _languageCode: string,
    _privateKey: JWKInterface|'use_wallet',
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'UpdateCategory'},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'updateCategory',
      langCode: _languageCode,
      label: _label,
      slug: _slug,
      parent: _parent,
      order: _order,
      active: _active
    };
    
    return this._warp.writeInteraction(
      this._arwikiToken.contractAddress, jwk, input, tags
    );
  }

}
