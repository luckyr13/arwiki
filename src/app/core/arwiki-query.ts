import ArDB from 'ardb';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ArwikiCategoriesContract } from '../arwiki-contracts/arwiki-categories';
import { ArwikiSettingsContract } from '../arwiki-contracts/arwiki-settings';

export class ArwikiQuery {
	private _ardb: ArDB;
	private _arweave: any;

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
  getVerifiedPages(owners: string[]): Observable<any> {
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['Validation'],
      },
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




}