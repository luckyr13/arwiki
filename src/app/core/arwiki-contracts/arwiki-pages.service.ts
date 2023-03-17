import { Injectable } from '@angular/core';
import { ArwikiTokenContract } from './arwiki-token.service';
import { WarpContractsService } from '../warp-contracts.service';
import { Observable, map } from 'rxjs';
import { ArwikiPageIndex } from '../interfaces/arwiki-page-index';
import { ArweaveService } from '../arweave.service';

@Injectable({
  providedIn: 'root'
})
export class ArwikiPagesService {

  constructor(
    private _arwikiToken: ArwikiTokenContract,
    private _warp: WarpContractsService,
    private _arweave: ArweaveService,) { }

  /*
  *  @dev Get the list of approved and active pages from full state contract
  * @param _numPages: -1 returns all values
  */
  getApprovedPages(
    _langCode: string,
    _numPages: number = -1
  ): Observable<ArwikiPageIndex> {
    return this._arwikiToken.getState().pipe(
      map((_state: any) => {
        let pageCounter = 0;
        const pagesIds = Object.keys(_state.pages[_langCode]).filter((slug) => {
          if (pageCounter >= _numPages && _numPages !== -1) {
            return false;
          }
          pageCounter++;
          return _state.pages[_langCode][slug].active;
        });
        const pages: ArwikiPageIndex = pagesIds.reduce((acum: any, slug) => {
          acum[slug] = JSON.parse(JSON.stringify(_state.pages[_langCode][slug]));
          const numUpdates = _state.pages[_langCode][slug].updates.length;
          acum[slug].id = _state.pages[_langCode][slug].updates[numUpdates - 1].tx;
          acum[slug].lastUpdateAt = _state.pages[_langCode][slug].updates[numUpdates - 1].at;
          
          return acum;
        }, {});
        return pages;
      })
    );
  }

  /*
  * @dev All pages needs to be validated first 
  * to be listed on the Arwiki. Validations are special TXs
  * with custom tags (Arwiki-Type: Validation)
  */
  approvePage(
    _pageId: string,
    _author: string,
    _slug: string,
    _category: string,
    _langCode: string,
    _pageValue: number,
    _privateKey: any,
    _arwikiVersion: string
  ) {

    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'Validation'},
      {name: 'Arwiki-Page-Id', value: _pageId},
      {name: 'Arwiki-Page-Slug', value: _slug},
      {name: 'Arwiki-Page-Category', value: _category},
      {name: 'Arwiki-Page-Lang', value: _langCode},
      {name: 'Arwiki-Page-Value', value: `${_pageValue}`},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'approvePage',
      author: _author,
      pageTX: _pageId,
      langCode: _langCode,
      category: _category,
      slug: _slug,
      pageValue: `${_pageValue}`
    };

    return this._warp.writeInteraction(
      this._arwikiToken.contractAddress, jwk, input, tags
    );
  }

  /*
  *  @dev Get the list of inactive pages from full state contract
  * @param _numPages: -1 returns all values
  */
  getInactivePages(
    _langCode: string,
    _numPages: number = -1
  ): Observable<any> {
    return this._arwikiToken.getState().pipe(
      map((_state: any) => {
        let pageCounter = 0;
        const pagesIds = Object.keys(_state.pages[_langCode]).filter((slug) => {
          if (pageCounter >= _numPages && _numPages !== -1) {
            return false;
          }
          pageCounter++;
          return !_state.pages[_langCode][slug].active;
        });
        const pages = pagesIds.reduce((acum: any, slug) => {
          acum[slug] = _state.pages[_langCode][slug];
          return acum;
        }, {});
        return pages;
      })
    );
  }

  /*
  *  @dev Get the list of all pages from full state contract
  * @param _numPages: -1 returns all values
  */
  getAllPages(
    _langCode: string,
    _numPages: number = -1
  ): Observable<any> {
    return this._arwikiToken.getState().pipe(
      map((_state: any) => {
        let pageCounter = 0;
        const pagesIds = Object.keys(_state.pages[_langCode]).filter((slug) => {
          if (pageCounter >= _numPages && _numPages !== -1) {
            return false;
          }
          pageCounter++;
          return true;
        });
        const pages = pagesIds.reduce((acum: any, slug) => {
          acum[slug] = {
            slug: slug,
            ..._state.pages[_langCode][slug]
          };
          return acum;
        }, {});
        return pages;
      })
    );
  }

  /*
  * @dev Stop stake and sponsorship
  */
  stopStaking(
    _slug: string,
    _langCode: string,
    _privateKey: any,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'StopStake'},
      {name: 'Arwiki-Page-Slug', value: _slug},
      {name: 'Arwiki-Page-Lang', value: _langCode},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'stopPageSponsorshipAndDeactivatePage',
      langCode: _langCode,
      slug: _slug
    };

    return this._warp.writeInteraction(
      this._arwikiToken.contractAddress, jwk, input, tags
    );
  }

  /*
  * @dev All pages updates needs to be validated first 
  * to be listed on the Arwiki. Validations are special TXs
  * with custom tags (Arwiki-Type: Validation)
  */
  approvePageUpdate(
    _pageId: string,
    _author: string,
    _slug: string,
    _category: string,
    _langCode: string,
    _pageValue: number,
    _privateKey: any,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'PageUpdateValidation'},
      {name: 'Arwiki-Page-Id', value: _pageId},
      {name: 'Arwiki-Page-Slug', value: _slug},
      {name: 'Arwiki-Page-Category', value: _category},
      {name: 'Arwiki-Page-Lang', value: _langCode},
      {name: 'Arwiki-Page-Value', value: `${_pageValue}`},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'addPageUpdate',
      updateTX: _pageId,
      langCode: _langCode,
      slug: _slug,
      author: _author,
      pageValue: _pageValue
    };

    return this._warp.writeInteraction(
      this._arwikiToken.contractAddress, jwk, input, tags
    );
  }

  /*
  * @dev Update sponsor
  * Note: This can reactivate an inactive page
  */
  updatePageSponsor(
    _slug: string,
    _category: string,
    _langCode: string,
    _pageValue: number,
    _privateKey: any,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'UpdateSponsor'},
      {name: 'Arwiki-Page-Slug', value: _slug},
      {name: 'Arwiki-Page-Category', value: _category},
      {name: 'Arwiki-Page-Lang', value: _langCode},
      {name: 'Arwiki-Page-Value', value: `${_pageValue}`},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'updatePageSponsor',
      langCode: _langCode,
      slug: _slug,
      pageValue: `${_pageValue}`
    };

    return this._warp.writeInteraction(
      this._arwikiToken.contractAddress, jwk, input, tags
    );
  }

  /*
  * @dev Upvote/downvote page
  */
  // Deprecated
  votePage(
    _target: string,
    _qty: string,
    _lang: string,
    _slug: string,
    _vote: boolean,
    _privateKey: any,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'VotePageAndDonate'},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'votePage',
      langCode: _lang,
      slug: _slug,
      vote: _vote,
    };
    _qty = this._arweave.arToWinston(_qty);
    const transfer = {target: _target, winstonQty: _qty};
    const strict = true;
    const disableBundler = true;
    return this._warp.writeInteraction(
      this._arwikiToken.contractAddress, jwk, input, tags, transfer, strict, disableBundler
    );
  }

  /*
  *  @dev 
  */
  getPageId(
    _langCode: string,
    _slug: string
  ): Observable<any> {
    return this._arwikiToken.getState().pipe(
      map((_state: any) => {
        if (_state &&
            Object.prototype.hasOwnProperty.call(_state, 'pages') &&
            Object.prototype.hasOwnProperty.call(_state.pages, _langCode) &&
            Object.prototype.hasOwnProperty.call(_state.pages[_langCode], _slug) 
          ) {
          let page = _state.pages[_langCode][_slug];
          if (page.updates.length > 0) {
            return page.updates[page.updates.length - 1].tx;
          }

          return page.content;
        }
        return null;
      })
    );
  }

  /*
  *  @dev 
  */
  getPageTranslations(slug: string): Observable<string[]> {
    return this._arwikiToken.getState().pipe(
      map((_state: any) => {
        const langs = Object.keys(_state.pages).filter((lang) => {
          return (slug in _state.pages[lang]);
        });

        return langs;
      })
    );
  }

  /*
  *  @dev Get the list of all pages from full state contract
  * @param _numPages: -1 returns all values
  */
  getAllPagesFromLocalState(
    _langCode: string,
    _numPages: number = -1
  ): any {
    const _state = this._arwikiToken.getStateFromLocal();
    let pageCounter = 0;
    const pagesIds = Object.keys(_state.pages[_langCode]).filter((slug) => {
      if (pageCounter >= _numPages && _numPages !== -1) {
        return false;
      }
      pageCounter++;
      return true;
    });
    const pages = pagesIds.reduce((acum: any, slug) => {
      const numUpdates = _state.pages[_langCode][slug].updates.length;
      acum[slug] = {
        slug: slug,
        id: _state.pages[_langCode][slug].updates[numUpdates - 1].tx,
        lastUpdateAt: _state.pages[_langCode][slug].updates[numUpdates - 1].at,
        ..._state.pages[_langCode][slug]
      };
      return acum;
    }, {});
    return pages;
  }

  /*
  *  @dev Get the list of approved and active pages from full state contract
  * @param _numPages: -1 returns all values
  */
  getApprovedPagesByCategory(
    _langCode: string,
    _categories: string[],
  ): Observable<ArwikiPageIndex> {
    return this._arwikiToken.getState().pipe(
      map((_state: any) => {
        const pagesIds = Object.keys(_state.pages[_langCode]).filter((slug) => {
          if (_categories.indexOf(_state.pages[_langCode][slug].category) < 0) {
            return false;
          }
          return _state.pages[_langCode][slug].active;
        });
        const pages: ArwikiPageIndex = pagesIds.reduce((acum: any, slug) => {
          acum[slug] = JSON.parse(JSON.stringify(_state.pages[_langCode][slug]));
          const numUpdates = _state.pages[_langCode][slug].updates.length;
          acum[slug].slug = slug;
          acum[slug].id = _state.pages[_langCode][slug].updates[numUpdates - 1].tx;
          acum[slug].lastUpdateAt = _state.pages[_langCode][slug].updates[numUpdates - 1].at;
          
          return acum;
        }, {});
        return pages;
      })
    );
  }


}
