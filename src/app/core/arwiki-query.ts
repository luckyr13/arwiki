import ArDB from 'ardb';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ArwikiCategoriesContract } from './arwiki-contracts/arwiki-categories';
import { ArwikiSettingsContract } from './arwiki-contracts/arwiki-settings';
import Arweave from 'arweave';
import { arwikiVersion } from './arwiki';

/*
*  Search the weave for arwiki data
*/
export class ArwikiQuery {
	private _ardb: ArDB;
	private _arweave: Arweave;
  private _addressesValidated: any;

	constructor(
    _arweave: Arweave
  ) {
		this._ardb = new ArDB(_arweave);
		this._arweave = _arweave;
	}

  /*
  * @dev
  */
  getMyArWikiPages(owner: string, limit: number = 100): Observable<any> {
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
        .limit(limit)
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
  getVerifiedPages(
    owners: string[],
    langCode: string,
    limit: number = 100,
    maxHeight: number = 0): Observable<any> {
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
      },
      {
        name: 'Arwiki-Page-Lang',
        values: [langCode]
      }
    ];

    const obs = new Observable((subscriber) => {
      this._ardb!.search('transactions')
        .limit(limit)
        .from(owners)
        .max(maxHeight)
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
  getPendingPages(
    _langCode: string,
    limit: number = 100, 
    _maxHeight: number = 0
  ): Observable<any> {
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
      },
      {
        name: 'Arwiki-Page-Lang',
        values: [_langCode]
      }
    ];

    const obs = new Observable((subscriber) => {
      this._ardb!.search('transactions')
        .limit(limit)
        .max(_maxHeight)
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
  *  @dev Helper class for searching a key in an array of tags
  */
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
  getVerifiedPagesByCategories(
    owners: string[],
    categories: string[],
    langCode: string,
    limit: number = 100,
    maxHeight: number = 0
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
        name: 'Arwiki-Page-Category',
        values: categories
      },
      {
        name: 'Arwiki-Version',
        values: arwikiVersion,
      },
      {
        name: 'Arwiki-Page-Lang',
        values: [langCode]
      }
    ];

    const obs = new Observable((subscriber) => {
      this._ardb!.search('transactions')
        .limit(limit)
        .from(owners)
        .max(maxHeight)
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
    _langCode: string,
    _privateKey: any
  ) {
    const jwk = _privateKey;
    const data = { pageId: _pageId, slug: _slug, category: _category };
    const tx = await this._arweave.createTransaction({
      data: JSON.stringify(data)
    }, jwk);
    tx.addTag('Content-Type', 'text/json');
    tx.addTag('Service', 'ArWiki');
    tx.addTag('Arwiki-Type', 'Validation');
    tx.addTag('Arwiki-Page-Id', _pageId);
    tx.addTag('Arwiki-Page-Slug', _slug);
    tx.addTag('Arwiki-Page-Category', _category);
    tx.addTag('Arwiki-Page-Lang', _langCode);
    tx.addTag('Arwiki-Version', arwikiVersion[0]);
    await this._arweave.transactions.sign(tx, jwk)
    await this._arweave.transactions.post(tx)
    return tx.id;
  }

 

  /*
  * @dev
  */
  getVerifiedPagesBySlug(
    owners: string[],
    slugList: string[],
    categories: string[],
    langCode: string,
    limit: number = 1,
    maxHeight: number = 0
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
        name: 'Arwiki-Page-Slug',
        values: slugList
      },
      {
        name: 'Arwiki-Version',
        values: arwikiVersion,
      },
      {
        name: 'Arwiki-Page-Lang',
        values: [langCode]
      },
      {
        name: 'Arwiki-Page-Category',
        values: categories
      }
    ];

    // Sort in ascending mode
    // This means that first slug validated is the right one 
    // (avoid duplicates)
    const obs = new Observable((subscriber) => {
      this._ardb!.search('transactions')
        .limit(limit)
        .from(owners)
        .max(maxHeight)
        .sort("HEIGHT_ASC")
        .tags(tags)
        .find().then((res) => {
          subscriber.next(res);
          subscriber.complete();
        })
        .catch((error) => {
          subscriber.error(error);
        });

    });
    return obs;
  }

  async createTagTXForArwikiPage(
    _pageId: string,
    _tag: string,
    _category_slug: string,
    _langCode: string,
    _privateKey: any
  ) {
    _tag = _tag.toLowerCase().trim();
    const jwk = _privateKey;
    const data = { pageId: _pageId, tag: _tag };
    const tx = await this._arweave.createTransaction({
      data: JSON.stringify(data)
    }, jwk);
    tx.addTag('Content-Type', 'text/json');
    tx.addTag('Service', 'ArWiki');
    tx.addTag('Arwiki-Type', 'Tag');
    tx.addTag('Arwiki-Page-Id', _pageId);
    tx.addTag('Arwiki-Page-Tag', _tag);
    tx.addTag('Arwiki-Page-Category', _category_slug);
    tx.addTag('Arwiki-Page-Lang', _langCode);
    tx.addTag('Arwiki-Version', arwikiVersion[0]);
    await this._arweave.transactions.sign(tx, jwk)
    await this._arweave.transactions.post(tx)
    return tx.id;
  }

  /*
  * @dev
  */
  getVerifiedTagsFromPages(
    owners: string[],
    pageIds: string[],
    limit: number = 100,
    maxHeight: number = 0
  ): Observable<any> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['Tag'],
      },
      {
        name: 'Arwiki-Page-Id',
        values: pageIds,
      }
    ];

    const obs = new Observable((subscriber) => {
      this._ardb!.search('transactions')
        .limit(limit)
        .from(owners)
        .max(maxHeight)
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
  getVerifiedTagsFromQueries(
    owners: string[],
    queries: string[],
    langCode: string,
    limit: number = 100,
    maxHeight: number = 0
  ): Observable<any> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['Tag'],
      },
      {
        name: 'Arwiki-Page-Tag',
        values: queries,
      },
      {
        name: 'Arwiki-Page-Lang',
        values: [langCode],
      }
    ];

    const obs = new Observable((subscriber) => {
      this._ardb!.search('transactions')
        .limit(limit)
        .from(owners)
        .max(maxHeight)
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
  isPageBySlugAlreadyTaken(
    _slug: string,
    _langCode: string,
    _settingsContract: ArwikiSettingsContract,
    _categoriesContract: ArwikiCategoriesContract,
    _maxHeight: number,
    _limit: number = 1
  ) {
    let categoriesCS: any = {};
    return _categoriesContract.getState()
      .pipe(
        switchMap((categoriesContractState) => {
          categoriesCS = Object.keys(categoriesContractState)
          return _settingsContract.getState();
        }),
        switchMap((settingsContractState) => {
          return this.getVerifiedPagesBySlug(
            Object.keys(settingsContractState.admin_list),
            [_slug],
            categoriesCS,
            _langCode,
            _limit,
            _maxHeight
          );
        }),
        switchMap((verifiedPages) => {
          return of(verifiedPages.length);
        })
      );
  }

}