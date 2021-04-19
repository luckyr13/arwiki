import ArDB from 'ardb';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ArwikiCategoriesContract } from '../arwiki-contracts/arwiki-categories';
import { ArwikiSettingsContract } from '../arwiki-contracts/arwiki-settings';

/*
*  List of arwiki versions supported
* arwikiVersion[0] is the latest supported version
*/
export const arwikiVersion = ['0.2'];

/*
*  Search the weave for arwiki data
*/
export class ArwikiQuery {
	private _ardb: ArDB;
	private _arweave: any;
  private _addressesValidated: any;

	constructor(_arweave: any) {
		this._ardb = new ArDB(_arweave);
		this._arweave = _arweave;
	}

  /*
  * @dev
  */
  getMyArWikiPages(owner: string): Observable<any> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['page'],
      },
      {
        name: 'Arwiki-Version',
        values: arwikiVersion,
      }      
    ];

    const obs = new Observable((subscriber) => {
      this._ardb!.search('transactions')
        .from(owner)
        .limit(100)
        .tags(tags).find().then((res) => {
          subscriber.next(res);
          subscriber.complete();
        }).catch((error) => {
          subscriber.error(error);
        });

    });
    return obs;
  }


  /*
  * @dev
  */
  getMainMenu(
    _categoriesContract: ArwikiCategoriesContract,
    _settingsContract: ArwikiSettingsContract
  ) {
    let _globalCat: any = {};
    return _categoriesContract.getState(this._arweave)
      .pipe(
        switchMap((categories) => {
          _globalCat = categories;
          return _settingsContract.getState(this._arweave);
        }),
        switchMap((settingsContractState) => {
          return this.getVerifiedPages(settingsContractState.adminList);
        }),
        switchMap((verifiedPages) => {
          const verifiedPagesList = [];
          for (let p of verifiedPages) {
            const vrfdPageId = this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Id');
            verifiedPagesList.push(vrfdPageId);
          }
          return this.getTXsData(verifiedPagesList);
        }),
        switchMap((txs) => {
          const finalRes: any = {};
          for (let p of txs) {
            const title = this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Title');
            const slug = this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug');
            const category = this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Category');
            const id = p.node.id;
            if (!Object.prototype.hasOwnProperty.call(finalRes, category)) {
              finalRes[category] = {};
            }
            
            finalRes[category][slug] = {
              title: title,
              slug: slug,
              category: category,
              id: id
            };
            
          }
          return of({ categories: _globalCat, pages: finalRes });
        })
      );
  }


  /*
  * @dev
  */
  getVerifiedPages(owners: string[], limit: number = 100): Observable<any> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['Validation'],
      },
      {
        name: 'Arwiki-Version',
        values: arwikiVersion,
      }
    ];

    const obs = new Observable((subscriber) => {
      this._ardb!.search('transactions')
        .limit(limit)
        .from(owners)
        .tags(tags).find().then((res) => {
          subscriber.next(res);
          subscriber.complete();
        })
        .catch((error) => {
          subscriber.error(error);
        });

    });
    return obs;
  }

  /*
  * @dev
  */
  verifyPages(
    owners: string[],
    pagesToVerify: string[],
    limit: number = 100
  ): Observable<any> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['Validation'],
      },
      {
        name: 'Arwiki-Page-Id',
        values: pagesToVerify
      },
      {
        name: 'Arwiki-Version',
        values: arwikiVersion,
      }    
    ];

    const obs = new Observable((subscriber) => {
      this._ardb!.search('transactions')
        .limit(limit)
        .from(owners)
        .tags(tags).find().then((res) => {
          subscriber.next(res);
          subscriber.complete();
        })
        .catch((error) => {
          subscriber.error(error);
        });

    });
    return obs;
  }

  /*
  * @dev
  */
  getTXsData(transactions: string[]): Observable<any> {
    
    const obs = new Observable((subscriber) => {
      this._ardb!.search('transactions')
        .ids(transactions).find().then((res) => {
          subscriber.next(res);
          subscriber.complete();
        })
        .catch((error) => {
          subscriber.error(error);
        });

    });
    return obs;
  }


  /*
  * @dev
  */
  getPendingPages(): Observable<any> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['page'],
      },
      {
        name: 'Arwiki-Version',
        values: arwikiVersion,
      }    
    ];

    const obs = new Observable((subscriber) => {
      this._ardb!.search('transactions')
        .limit(100)
        .tags(tags).find().then((res) => {
          subscriber.next(res);
          subscriber.complete();
        }).catch((error) => {
          subscriber.error(error);
        });

    });
    return obs;
  }




  searchKeyNameInTags(_arr: any[], _key: string) {
    let res = '';
    for (const a of _arr) {
      if (a.name === _key) {
        return a.value;
      }
    }
    return res;
  }

  /*
  * @dev
  */
  getPagesByCategory(
    _category: string,
    _settingsContract: ArwikiSettingsContract
  ) {
    return _settingsContract.getState(this._arweave)
      .pipe(
        switchMap((settingsContractState) => {
          return this.getVerifiedPagesByCategories(
            settingsContractState.adminList,
            [_category]
          );
        }),
        switchMap((verifiedPages) => {
          const verifiedPagesList = [];
          for (let p of verifiedPages) {
            const vrfdPageId = this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Id');
            verifiedPagesList.push(vrfdPageId);
          }

          return this.getTXsData(verifiedPagesList);
        }),
        switchMap((txs) => {
          const finalRes: any = [];
          for (let p of txs) {
            const title = this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Title');
            const slug = this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug');
            const category = this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Category');
            const img = this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Img');
            const owner = p.node.owner.address;
            const id = p.node.id;
            
            finalRes.push({
              title: title,
              slug: slug,
              category: category,
              img: img,
              owner: owner,
              id: id
            });
            
          }
          return of(finalRes);
        })
      );
  }

  /*
  * @dev
  */
  getVerifiedPagesByCategories(owners: string[], categories: string[]): Observable<any> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['Validation'],
      },
      {
        name: 'Arwiki-Page-Category',
        values: categories
      },
      {
        name: 'Arwiki-Version',
        values: arwikiVersion,
      }
    ];

    const obs = new Observable((subscriber) => {
      this._ardb!.search('transactions')
        .limit(100)
        .from(owners)
        .tags(tags).find().then((res) => {
          subscriber.next(res);
          subscriber.complete();
        })
        .catch((error) => {
          subscriber.error(error);
        });

    });
    return obs;
  }


  async createValidationTXForArwikiPage(
    _pageId: string,
    _slug: string,
    _category: string,
    _privateKey: any
  ) {
    const jwk = _privateKey;
    const data = { pageId: _pageId, slug: _slug, category: _category };
    const tx = await this._arweave.arweave.createTransaction({
      data: JSON.stringify(data)
    }, jwk);
    tx.addTag('Content-Type', 'text/json');
    tx.addTag('Service', 'ArWiki');
    tx.addTag('Arwiki-Type', 'Validation');
    tx.addTag('Arwiki-Page-Id', _pageId);
    tx.addTag('Arwiki-Page-Slug', _slug);
    tx.addTag('Arwiki-Page-Category', _category);
    tx.addTag('Arwiki-Version', arwikiVersion[0]);
    await this._arweave.arweave.transactions.sign(tx, jwk)
    await this._arweave.arweave.transactions.post(tx)
    return tx.id;
  }

}