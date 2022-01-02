import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ArwikiPage } from '../core/interfaces/arwiki-page';
import { ArwikiTokenContract } from '../core/arwiki-contracts/arwiki-token';
import { Observable } from 'rxjs';
import { switchMap, tap, map } from 'rxjs/operators';
import { ArwikiQuery } from '../core/arwiki-query';
import { ArweaveService } from '../core/arweave.service';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';
import DOMPurify from 'dompurify';
import { UserSettingsService } from '../core/user-settings.service';
declare const document: any;

@Injectable({
  providedIn: 'root'
})
export class SeoResolverService implements Resolve<ArwikiPage> {
   constructor(
    private _arwikiTokenContract: ArwikiTokenContract,
  	private _arweave: ArweaveService,
  	private _userSettings: UserSettingsService
  ) { }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any>|Promise<any>|any {
  	let lang = '';
    if (route.params.lang) {
      lang = route.params.lang;
    }
    let slug = '';
    if (route.params.slug) {
      slug = route.params.slug;
    }
    return this.getPageBySlug(slug, lang);
  }

  /*
  * @dev
  */
  getPageBySlug(
    _slug: string,
    _langCode: string
  ) {
    let categoriesCS: any = {};
    let adminList: string[] = [];
    const arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    const verifiedPagesList: string[] = [];
    // Loader
    this._userSettings.updateMainToolbarLoading(true);
    return this._arwikiTokenContract.getCategories()
      .pipe(
        switchMap((categoriesContractState) => {
          categoriesCS = Object.keys(categoriesContractState);
          return this._arwikiTokenContract.getAdminList();
        }),
        switchMap((_adminList: string[]) => {
          adminList = _adminList;
          return this._arwikiTokenContract.getApprovedPages(
            _langCode,
            -1,
            true
          );
        }),
        switchMap((verifiedPages) => {
          const p = verifiedPages[_slug];
          
          if (p && p.content) {
            verifiedPagesList.push(p.content);
          } else {
            throw Error('Page does not exist!');
          }

          return arwikiQuery.getTXsData(verifiedPagesList);
        }),
        map((data: ArdbTransaction[]|ArdbBlock[]) => {
        	let finalRes: ArwikiPage = {
				    id: '',
				    title: '',
				    slug: '',
				    category: '',
				    language: '',
				    owner: '',
				    img: '',
				  };
	        for (let p of data) {
	          const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
	          const title = arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
	          const slug = arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug');
	          const category = arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category');
	          const img = arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img');
	          const owner = pTX.owner.address;
	          const id = pTX.id;
	          const block = pTX.block;
	          
	          finalRes = {
	            title: this.removeHTMLfromStr(title),
	            slug: this.removeHTMLfromStr(slug),
	            category: this.removeHTMLfromStr(category),
	            img: `${this._arweave.baseURL}${this.removeHTMLfromStr(img)}`,
	            owner: owner,
	            id: id,
	            block: block,
	            language: _langCode
	          };
	          
	        }
	        // Loader
          this._userSettings.updateMainToolbarLoading(false);
         	return finalRes;
        })
      );
  }

  removeHTMLfromStr(_html: string) {
    return DOMPurify.sanitize(_html, {ALLOWED_TAGS: []});
  }
}
