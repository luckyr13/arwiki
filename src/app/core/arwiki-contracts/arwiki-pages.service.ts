import { Injectable } from '@angular/core';
import { ArwikiTokenContract } from './arwiki-token.service';
import { WarpContractsService } from '../warp-contracts.service';
import { Observable, map } from 'rxjs';
import { ArwikiPageIndex } from '../interfaces/arwiki-page-index';
import { ArweaveService } from '../arweave.service';
import { UtilsService } from '../utils.service';
import { ArwikiPage } from '../interfaces/arwiki-page';
import { JWKInterface } from 'arweave/web/lib/wallet';

@Injectable({
  providedIn: 'root'
})
export class ArwikiPagesService {

  constructor(
    private _arwikiToken: ArwikiTokenContract,
    private _warp: WarpContractsService,
    private _arweave: ArweaveService,
    private _utils: UtilsService) { }

  /*
  *  @dev Get the list of approved and active pages from full state contract
  * @param _numPages: -1 returns all values
  */
  getApprovedPages(
    _langCode: string,
    _numPages: number = -1,
    _reload = false
  ): Observable<ArwikiPageIndex> {
    return this._arwikiToken.getState(_reload).pipe(
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
          acum[slug] = this._utils.cloneObject(_state.pages[_langCode][slug]);
          const numUpdates = _state.pages[_langCode][slug].updates.length;
          acum[slug].id = _state.pages[_langCode][slug].updates[numUpdates - 1].tx;
          acum[slug].lastUpdateAt = _state.pages[_langCode][slug].updates[numUpdates - 1].at;
          acum[slug].slug = slug;
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
    _author: string,
    _pageId: string,
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
      pageTX: _pageId,
      langCode: _langCode,
      category: _category,
      slug: _slug,
      pageValue: `${_pageValue}`,
      author: _author

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
    _numPages: number = -1,
    _reload=false
  ): Observable<any> {
    return this._arwikiToken.getState(_reload).pipe(
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
            ...this._utils.cloneObject(_state.pages[_langCode][slug])
          };
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
          let page = this._utils.cloneObject(
            _state.pages[_langCode][_slug]
          );
          if (page.updates.length > 0) {
            return page.updates[page.updates.length - 1].tx;
          }
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
  *  @dev Get the list of approved and active pages from full state contract
  * @param _numPages: -1 returns all values
  */
  getApprovedPagesByCategory(
    _langCode: string,
    _categories: string[],
    _onlyActivePages=true
  ): Observable<ArwikiPageIndex> {
    return this._arwikiToken.getState().pipe(
      map((_state: any) => {
        const pagesIds = Object.keys(_state.pages[_langCode]).filter((slug) => {
          if (_categories.indexOf(_state.pages[_langCode][slug].category) < 0) {
            return false;
          }
          if (!_onlyActivePages) {
            return true;
          }
          return _state.pages[_langCode][slug].active;
        });
        const pages: ArwikiPageIndex = pagesIds.reduce((acum: any, slug) => {
          acum[slug] = this._utils.cloneObject(_state.pages[_langCode][slug]);
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

  /*
  * @dev Pending Pages can be rejected
  * if an admin creates a Reject TX (Arwiki-Type: PageRejected)
  */
  async createRejectTXForArwikiPage(
    _pageId: string,
    _slug: string,
    _langCode: string,
    _reason: string,
    _privateKey: any,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const data = `${_reason}`.trim();
    const tx = await this._arweave.arweave.createTransaction({
      data
    }, jwk);
    tx.addTag('Content-Type', 'text/plain');
    tx.addTag('Service', 'ArWiki');
    tx.addTag('Arwiki-Type', 'PageRejected');
    tx.addTag('Arwiki-Page-Id', _pageId);
    tx.addTag('Arwiki-Page-Slug', _slug);
    tx.addTag('Arwiki-Page-Lang', _langCode);
    tx.addTag('Arwiki-Page-Reason', _reason);
    tx.addTag('Arwiki-Version', _arwikiVersion);
    await this._arweave.arweave.transactions.sign(tx, jwk);
    const response = await this._arweave.arweave.transactions.post(tx);
    if (response.status != 200) {
      throw Error(`Error ${response.statusText}`);
    }
    return tx.id;
  }

  /*
  *  @dev Get the full structure for all pages
  */
  getAllPagesByLangCode(
    _onlyActive=false,
    _reload=false
  ): Observable<any> {
    return this._arwikiToken.getState(_reload).pipe(
      map((_state: any) => {
        let pageCounter = 0;
        const pagesLangsCodes = Object.keys(_state.pages);
        const pages = pagesLangsCodes.reduce((acum: any, langCode) => {
          acum[langCode] = {
            ...this._utils.cloneObject(_state.pages[langCode])
          };
          const tmpPages = this._utils.cloneObject(acum[langCode]);
          for (let slug in tmpPages) {
            if (_onlyActive && !acum[langCode][slug].active) {
              delete acum[langCode][slug];
              continue;
            }
            acum[langCode][slug].slug = slug;
            const numUpdates = acum[langCode][slug].updates.length;
            acum[langCode][slug].id = acum[langCode][slug].updates[numUpdates - 1].tx;
            acum[langCode][slug].lastUpdateAt = acum[langCode][slug].updates[numUpdates - 1].at;
          }         
          return acum;
        }, {});
        return pages;
      })
    );
  }

  /*
  *  @dev 
  */
  getPage(
    _langCode: string,
    _slug: string
  ): Observable<ArwikiPage|null> {
    return this._arwikiToken.getState().pipe(
      map((_state: any) => {
        if (_state &&
            Object.prototype.hasOwnProperty.call(_state, 'pages') &&
            Object.prototype.hasOwnProperty.call(_state.pages, _langCode) &&
            Object.prototype.hasOwnProperty.call(_state.pages[_langCode], _slug) 
          ) {
          let page = this._utils.cloneObject(
            _state.pages[_langCode][_slug]
          );
          page.slug = _slug;
          const numUpdates = page.updates.length;
          page.id = page.updates[numUpdates - 1].tx;
          page.lastUpdateAt = page.updates[numUpdates - 1].at;
          return page;
        }
        return null;
      })
    );
  }

  updatePageProperties(
    _slug: string,
    _order: number,
    _nft: string,
    _showInMenu: boolean,
    _showInMainPage: boolean,
    _showInFooter: boolean,
    _languageCode: string,
    _privateKey: JWKInterface|'use_wallet',
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'UpdatePageProperties'},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'updatePageProperties',
      langCode: _languageCode,
      slug: _slug,
      order: _order,
      nft: _nft,
      showInMenu: _showInMenu,
      showInMainPage: _showInMainPage,
      showInFooter: _showInFooter
    };
    
    return this._warp.writeInteraction(
      this._arwikiToken.contractAddress, jwk, input, tags
    );
  }


}
