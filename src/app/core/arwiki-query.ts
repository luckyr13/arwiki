import ArDB from 'ardb';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import Arweave from 'arweave';
import { arwikiVersion } from './arwiki';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';

/*
*  Search the weave for arwiki data
*/
export class ArwikiQuery {
	private _ardb: ArDB;
	private _arweave: Arweave;

	constructor(
    _arweave: Arweave
  ) {
		this._ardb = new ArDB(_arweave);
		this._arweave = _arweave;
	}

  /*
  * @dev
  */
  getMyArWikiPages(
    owner: string,
    langCode: string,
    limit: number = 100): Observable<ArdbTransaction[]|ArdbBlock[]> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['Page'],
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

    const obs = new Observable<ArdbTransaction[]|ArdbBlock[]>((subscriber) => {
      this._ardb.search('transactions')
        .from(owner)
        .limit(limit)
        .tags(tags).find().then((res: ArdbTransaction[]|ArdbBlock[]) => {
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
    maxHeight: number = 0): Observable<ArdbTransaction[]|ArdbBlock[]> {
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

    const obs = new Observable<ArdbTransaction[]|ArdbBlock[]>((subscriber) => {
      this._ardb.search('transactions')
        .limit(limit)
        .from(owners)
        .max(maxHeight)
        .tags(tags).find().then((res: ArdbTransaction[]|ArdbBlock[]) => {
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
  ): Observable<ArdbTransaction[]|ArdbBlock[]> {
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

    const obs = new Observable<ArdbTransaction[]|ArdbBlock[]>((subscriber) => {
      this._ardb.search('transactions')
        .limit(limit)
        .from(owners)
        .tags(tags).find().then((res: ArdbTransaction[]|ArdbBlock[]) => {
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
  getTXsData(transactions: string[]): Observable<ArdbTransaction[]|ArdbBlock[]> {
    const limit = transactions.length && transactions.length <= 100 ?
        transactions.length : 100;
    const obs = new Observable<ArdbTransaction[]|ArdbBlock[]>((subscriber) => {
      this._ardb.search('transactions')
        .limit(limit)
        .ids(transactions).find().then((res: ArdbTransaction[]|ArdbBlock[]) => {
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
    _categories: string[],
    limit: number = 100, 
    _maxHeight: number = 0
  ): Observable<ArdbTransaction[]|ArdbBlock[]> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['Page'],
      },
      {
        name: 'Arwiki-Version',
        values: arwikiVersion,
      },
      {
        name: 'Arwiki-Page-Lang',
        values: [_langCode]
      },
      {
        name: 'Arwiki-Page-Category',
        values: _categories
      }
    ];

    const obs = new Observable<ArdbTransaction[]|ArdbBlock[]>((subscriber) => {
      this._ardb.search('transactions')
        .limit(limit)
        .max(_maxHeight)
        .tags(tags).find().then((res: ArdbTransaction[]|ArdbBlock[]) => {
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
  ): Observable<ArdbTransaction[]|ArdbBlock[]> {
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

    const obs = new Observable<ArdbTransaction[]|ArdbBlock[]>((subscriber) => {
      this._ardb.search('transactions')
        .limit(limit)
        .from(owners)
        .max(maxHeight)
        .tags(tags).find().then((res: ArdbTransaction[]|ArdbBlock[]) => {
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
  getVerifiedPagesBySlug(
    owners: string[],
    slugList: string[],
    categories: string[],
    langCode: string,
    limit: number = 1,
    maxHeight: number = 0
  ): Observable<ArdbTransaction[]|ArdbBlock[]> {
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
    const obs = new Observable<ArdbTransaction[]|ArdbBlock[]>((subscriber) => {
      this._ardb.search('transactions')
        .limit(limit)
        .from(owners)
        .max(maxHeight)
        .sort("HEIGHT_ASC")
        .tags(tags)
        .find().then((res: ArdbTransaction[]|ArdbBlock[]) => {
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
  getVerifiedTagsFromPages(
    owners: string[],
    pageIds: string[],
    limit: number = 100,
    maxHeight: number = 0
  ): Observable<ArdbTransaction[]|ArdbBlock[]> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['PageTag'],
      },
      {
        name: 'Arwiki-Page-Id',
        values: pageIds,
      },
      {
        name: 'Arwiki-Version',
        values: arwikiVersion,
      } 
    ];

    const obs = new Observable<ArdbTransaction[]|ArdbBlock[]>((subscriber) => {
      this._ardb.search('transactions')
        .limit(limit)
        .from(owners)
        .max(maxHeight)
        .tags(tags).find().then((res: ArdbTransaction[]|ArdbBlock[]) => {
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
  getVerifiedTagsFromSlug(
    owners: string[],
    slug: string,
    langCode: string,
    limit: number = 100,
    maxHeight: number = 0
  ): Observable<ArdbTransaction[]|ArdbBlock[]> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['PageTag'],
      },
      {
        name: 'Arwiki-Page-Slug',
        values: [slug],
      },
      {
        name: 'Arwiki-Version',
        values: arwikiVersion,
      },
      {
        name: 'Arwiki-Page-Lang',
        values: [langCode],
      }
    ];

    const obs = new Observable<ArdbTransaction[]|ArdbBlock[]>((subscriber) => {
      this._ardb.search('transactions')
        .limit(limit)
        .from(owners)
        .max(maxHeight)
        .tags(tags).find().then((res: ArdbTransaction[]|ArdbBlock[]) => {
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
  * @dev Search engine
  */
  getVerifiedTagsFromQueries(
    owners: string[],
    queries: string[],
    langCode: string,
    limit: number = 100,
    maxHeight: number = 0
  ): Observable<ArdbTransaction[]|ArdbBlock[]> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['PageTag'],
      },
      {
        name: 'Arwiki-Page-Tag',
        values: queries,
      },
      {
        name: 'Arwiki-Page-Lang',
        values: [langCode],
      },
      {
        name: 'Arwiki-Version',
        values: arwikiVersion,
      } 
    ];

    const obs = new Observable<ArdbTransaction[]|ArdbBlock[]>((subscriber) => {
      this._ardb.search('transactions')
        .limit(limit)
        .from(owners)
        .max(maxHeight)
        .tags(tags).find().then((res: ArdbTransaction[]|ArdbBlock[]) => {
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
  getDeletedPagesTX_realQuery(
    owners: string[],
    pageIds: string[],
    langCode: string,
    limit: number = 100,
    maxHeight: number = 0
  ): Observable<ArdbTransaction[]|ArdbBlock[]> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['DeletePage'],
      },
      {
        name: 'Arwiki-Page-Id',
        values: pageIds,
      },
      {
        name: 'Arwiki-Page-Lang',
        values: [langCode],
      },
      {
        name: 'Arwiki-Version',
        values: arwikiVersion,
      } 
    ];

    const obs = new Observable<ArdbTransaction[]|ArdbBlock[]>((subscriber) => {
      this._ardb!.search('transactions')
        .limit(limit)
        .from(owners)
        .max(maxHeight)
        .tags(tags).find().then((res: ArdbTransaction[]|ArdbBlock[]) => {
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
  getDeletedPagesTX_deprecated(
    owners: string[],
    pageIds: string[],
    langCode: string,
    limit: number = 100,
    maxHeight: number = 0
  ): Observable<any> {
    const obs = new Observable((subscriber) => {
      // DO NOTHING!
      subscriber.next([]);
      subscriber.complete();

    });
    return obs;
  }

  /*
  * @dev The latest MainPage TX is considerated as the right one
  */
  getMainPageTX(
    owners: string[],
    categories: string[],
    langCode: string,
    limit: number = 1,
    maxHeight: number = 0
  ): Observable<ArdbTransaction[]|ArdbBlock[]> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['MainPage'],
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

    const obs = new Observable<ArdbTransaction[]|ArdbBlock[]>((subscriber) => {
      this._ardb!.search('transactions')
        .limit(limit)
        .from(owners)
        .max(maxHeight)
        .tags(tags)
        .find().then((res: ArdbTransaction[]|ArdbBlock[]) => {
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
  getAllDeletedPages(
    owners: string[],
    langCode: string,
    limit: number = 100,
    maxHeight: number = 0
  ): Observable<ArdbTransaction[]|ArdbBlock[]> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['DeletePage'],
      },
      {
        name: 'Arwiki-Page-Lang',
        values: [langCode],
      },
      {
        name: 'Arwiki-Version',
        values: arwikiVersion,
      } 
    ];

    const obs = new Observable<ArdbTransaction[]|ArdbBlock[]>((subscriber) => {
      this._ardb!.search('transactions')
        .limit(limit)
        .from(owners)
        .max(maxHeight)
        .tags(tags).find().then((res: ArdbTransaction[]|ArdbBlock[]) => {
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
  getMyArWikiPagesUpdates(
    owner: string,
    langCode: string,
    limit: number = 100): Observable<ArdbTransaction[]|ArdbBlock[]> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['PageUpdate'],
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

    const obs = new Observable<ArdbTransaction[]|ArdbBlock[]>((subscriber) => {
      this._ardb!.search('transactions')
        .from(owner)
        .limit(limit)
        .tags(tags).find().then((res: ArdbTransaction[]|ArdbBlock[]) => {
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
  getPendingPagesUpdates(
    _langCode: string,
    _slug: string,
    limit: number = 100, 
    _maxHeight: number = 0
  ): Observable<ArdbTransaction[]|ArdbBlock[]> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['PageUpdate'],
      },
      {
        name: 'Arwiki-Version',
        values: arwikiVersion,
      },
      {
        name: 'Arwiki-Page-Lang',
        values: [_langCode]
      },
      {
        name: 'Arwiki-Page-Slug',
        values: [_slug]
      }
    ];

    const obs = new Observable<ArdbTransaction[]|ArdbBlock[]>((subscriber) => {
      this._ardb!.search('transactions')
        .limit(limit)
        .max(_maxHeight)
        .tags(tags).find().then((res: ArdbTransaction[]|ArdbBlock[]) => {
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
  getPendingPagesUpdatesByLang(
    _langCode: string,
    limit: number = 100, 
    _maxHeight: number = 0
  ): Observable<ArdbTransaction[]|ArdbBlock[]> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['PageUpdate'],
      },
      {
        name: 'Arwiki-Version',
        values: arwikiVersion,
      },
      {
        name: 'Arwiki-Page-Lang',
        values: [_langCode]
      },
    ];

    const obs = new Observable<ArdbTransaction[]|ArdbBlock[]>((subscriber) => {
      this._ardb!.search('transactions')
        .limit(limit)
        .max(_maxHeight)
        .tags(tags).find().then((res: ArdbTransaction[]|ArdbBlock[]) => {
          subscriber.next(res);
          subscriber.complete();
        }).catch((error) => {
          subscriber.error(error);
        });

    });
    return obs;
  }

}