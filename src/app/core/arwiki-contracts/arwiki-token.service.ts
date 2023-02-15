import { Injectable } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { ArweaveService } from '../arweave.service';
import { map, tap } from 'rxjs/operators';
import { JWKInterface } from 'arweave/node/lib/wallet';
import { ArwikiKYVE } from '../arwiki-kyve';
import { ArwikiPageIndex } from '../interfaces/arwiki-page-index';
import { ArwikiLangIndex } from '../interfaces/arwiki-lang-index';
import { ArwikiCategoryIndex } from '../interfaces/arwiki-category-index';
import { WarpContractsService } from '../warp-contracts.service';
import { ArwikiVote } from '../interfaces/arwiki-vote';

@Injectable({
  providedIn: 'root'
})
export class ArwikiTokenContract
{
  private _contractAddress: string = 'ewepANKEVffP0cm_XKjwTYhSBqaiQrJbVrCcBiWqw-s';
	private _state: any = {};
	private _adminList: string[] = [];
  private _arwikiKYVE: ArwikiKYVE;

	get contractAddress() {
		return this._contractAddress;
	}

	constructor(
    private _arweave: ArweaveService,
    private _warp: WarpContractsService
  ) {
    this._arwikiKYVE = new ArwikiKYVE(_arweave.arweave);
	}

	deployNewContract() {
		
	}

  getStateFromKYVE(reload: boolean = false) {
    if (Object.keys(this._state).length > 0 && !reload) {
      return of(this._state);
    }
    return this._arwikiKYVE.getLastStates()
      .pipe(
        map((_kyveRes: any) => {
          this._state = {};
          this._adminList = [];
          if (_kyveRes && _kyveRes[0]) {
            _kyveRes = JSON.parse(_kyveRes[0]);
            this._state = _kyveRes.state;
            this._adminList = Object.keys(this._state.roles).filter((address) => {
              return this._state.roles[address].toUpperCase() === 'MODERATOR';
            });
          } else {
            throw Error('Error loading contract state :(');
          }
          return this._state;
          
        })
      );
  }

  /*
  *  @dev Get full contract state as Observable
  */
  getStateFromContract(reload: boolean = false): Observable<any> {
    const obs = new Observable<any>((subscriber) => {
      if (Object.keys(this._state).length > 0 && !reload) {
        subscriber.next(this._state);
        subscriber.complete();
      } else {
        this._warp.readState(this._contractAddress).subscribe({
          next: (res) => {
            const cachedValue = res.cachedValue;
            const sortKey = res.sortKey;
            const state = cachedValue &&
              Object.prototype.hasOwnProperty.call(cachedValue, 'state') ?
              cachedValue.state : {};
            this._state = state;

            this._adminList = Object.keys(this._state.roles).filter((address) => {
              return this._state.roles[address].toUpperCase() === 'MODERATOR';
            });

            subscriber.next(this._state);
            subscriber.complete();
          }, error: (err) => {
            subscriber.error(err);
          }
        })

      }

    });

    return obs;
  }

	/*
	*	@dev Return state
	*/
	getState(reload: boolean = false, useKYVE: boolean = false): Observable<any> {
		if (useKYVE) {
      return this.getStateFromKYVE(reload);
    }
    else {
      return this.getStateFromContract(reload);
    }
	}

  /*
  *  @dev Return state
  */
  getStateFromLocal(): Observable<any> {
    return this._state;
  }

	/*
	*	@dev Get only the admin list from full state contract
	*/
	getAdminList(): Observable<string[]> {
		return this.getState().pipe(
			map((_state: any) => {
				this._adminList = Object.keys(_state.roles).filter((address) => {
					return _state.roles[address].toUpperCase() === 'MODERATOR';
				});

				return this._adminList;
			})
		);
	}

	/*
	*	@dev Get only the admin list from full state contract
	*/
	isAdmin(address: string): Observable<boolean> {
		return this.getAdminList().pipe(
			map( (admin_list: string[]) => {
				return Array.prototype.indexOf.call(admin_list, address) >= 0; 
			})
		);
	}

	/*
	*	@dev Execute read function on PST contract
	*/
	getBalance(address: string, reload: boolean = false): Observable<any> {
		return this.getState(reload).pipe(
			map((_state: any) => {
				const balances = _state.balances;
				const vault = _state.vault;
				const stakes = _state.stakes;
				const balance = this.getBalanceDetail(address, balances, vault, stakes);
				return balance.result;
			})
		);
	}

  /*
  *  @dev Execute read function on PST contract
  */
  getBalanceAndTotalSupply(address: string, reload: boolean = false): Observable<any> {
    return this.getState(reload).pipe(
      map((_state: any) => {
        const balances = _state.balances;
        const vault = _state.vault;
        const stakes = _state.stakes;
        const balance = this.getBalanceDetail(address, balances, vault, stakes);
        const totalSupply = this._calculate_total_supply(
          vault, balances, stakes
        );
        return { balance: balance.result, totalSupply: totalSupply };
      })
    );
  }

  /*
  *  @dev Execute read function on PST contract
  */
  getTotalSupply(reload: boolean = false): Observable<any> {
    return this.getState(reload).pipe(
      map((_state: any) => {
        const balances = _state.balances;
        const vault = _state.vault;
        const stakes = _state.stakes;
        const totalSupply = this._calculate_total_supply(
          vault, balances, stakes
        );
        return totalSupply;
      })
    );
  }

  _calculate_total_supply(vault: any, balances: any, stakes: any) {
    const vaultValues2 = Object.values(vault);
    let totalSupply = 0;
    for (let i = 0, j = vaultValues2.length; i < j; i++) {
      const locked: any = vaultValues2[i];
      for (let j2 = 0, k = locked.length; j2 < k; j2++) {
        totalSupply += locked[j2].balance;
      }
    }
    const balancesValues: any = Object.values(balances);
    for (let i = 0, j = balancesValues.length; i < j; i++) {
      totalSupply += balancesValues[i];
    }
    for (const target of Object.keys(stakes)) {
      for (const vLang of Object.keys(stakes[target])) {
        for (const vSlug of Object.keys(stakes[target][vLang])) {
          totalSupply += stakes[target][vLang][vSlug];
        }
      }
    }
  return totalSupply;
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
      this._contractAddress, jwk, input, tags
    );
  }

  /*
	*	@dev Get the settings property from full state contract
	*/
	getSettings(): Observable<any> {
		return this.getState().pipe(
			map((_state: any) => {
				const settings = new Map(_state.settings);
				return settings;
			})
		);
	}

	/*
	*	@dev Get the list of approved pages from full state contract
	* @param _numPages: -1 returns all values
	*/
	getApprovedPages(
		_langCode: string,
		_numPages: number = -1,
		_overrideContentWithUpd: boolean = false
	): Observable<ArwikiPageIndex> {
		return this.getState().pipe(
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
					if (numUpdates && _overrideContentWithUpd) {
						acum[slug].content = _state.pages[_langCode][slug].updates[numUpdates - 1].tx;
					}
					return acum;
				}, {});
				return pages;
			})
		);
	}

	getBalanceDetail(_target: string, _balances: any, _vault: any, _stakes: any) {
    const target = _target;
    const balances = _balances;
    const vault = _vault;
    const stakes = _stakes;
    let unlockedBalance = 0;
    let vaultBalance = 0;
    let stakingBalance = 0;
    if (target in balances) {
      unlockedBalance = balances[target];
    }
    if (target in vault && vault[target].length) {
      try {
        vaultBalance += vault[target].map((a: any) => a.balance).reduce((a: any, b: any) => a + b, 0);
      } catch (e) {
      }
    }
    const stakingDict = stakes[target] ? stakes[target] : {};
    for (const vLang of Object.keys(stakingDict)) {
      for (const vSlug of Object.keys(stakingDict[vLang])) {
        stakingBalance += stakes[target][vLang][vSlug];
      }
    }
    return {result: {target, unlockedBalance, vaultBalance, stakingBalance}};
  }
  
  /*
	*	@dev Get the list of inactive pages from full state contract
	* @param _numPages: -1 returns all values
	*/
	getInactivePages(
		_langCode: string,
		_numPages: number = -1
	): Observable<any> {
		return this.getState().pipe(
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
	*	@dev Get the list of all pages from full state contract
	* @param _numPages: -1 returns all values
	*/
	getAllPages(
		_langCode: string,
		_numPages: number = -1
	): Observable<any> {
		return this.getState().pipe(
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
      this._contractAddress, jwk, input, tags
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
      this._contractAddress, jwk, input, tags
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
      this._contractAddress, jwk, input, tags
    );
  }


  /*
  * @dev Create vote proposal for new Moderator
  */
  registerAdmin(
    _target: string,
    _privateKey: any,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'ProposeModerator'},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'propose',
      type: 'set',
      key: 'role',
      recipient: _target,
      value: 'Moderator',
      note: 'New Moderator'
    };
    return this._warp.writeInteraction(
      this._contractAddress, jwk, input, tags
    );
  }

  /*
  *  @dev Get Categories
  */
  getCategories(): Observable<ArwikiCategoryIndex> {
    return this.getState().pipe(
      map((_state: any) => {
        const categories = _state.categories;
        return categories;
      })
    );
  }

  /*
  *  @dev Get Categories
  */
  getLanguages(): Observable<ArwikiLangIndex> {
    return this.getState().pipe(
      map((_state: any) => {
        const languages = _state.languages;
        return languages;
      })
    );
  }

  /*
  * @dev Transfer wiki tokens
  */
  transferTokens(
    _target: string,
    _privateKey: any,
    _amount: number,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'TransferTokens'},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'transfer',
      target: _target,
      qty: _amount,
    };
    
    return this._warp.writeInteraction(
      this._contractAddress, jwk, input, tags
    );
  }

  /*
  * @dev Upvote/downvote page
  */
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
      this._contractAddress, jwk, input, tags, transfer, strict, disableBundler
    );
  }

  /*
  *  @dev Get all balances variables
  */
  getAllBalances(): Observable<any> {
    return this.getState().pipe(
      map((_state: any) => {
        const res = {
          'vault': _state.vault,
          'stakes': _state.stakes,
          'balance': _state.balances
        };
        return res;
      })
    );
  }

  /*
  * @dev Lock tokens in vault
  */
  lockTokensInVault(
    _lockLength: number,
    _amount: number,
    _privateKey: any,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'LockInVault'},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'lock',
      lockLength: _lockLength,
      qty: _amount,
    };
    
    return this._warp.writeInteraction(
      this._contractAddress, jwk, input, tags
    );
  }

  /*
  * @dev Unlock vault
  */
  unlockVault(
    _privateKey: any,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'UnlockVault'},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'unlock'
    };
    
    return this._warp.writeInteraction(
      this._contractAddress, jwk, input, tags
    );
  }

  /*
  *  @dev Get the list of all pages from full state contract
  * @param _numPages: -1 returns all values
  */
  getPageId(
    _langCode: string,
    _slug: string
  ): Observable<any> {
    return this.getState().pipe(
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
  *  @dev Get only the admin list from full state contract
  */
  getPageTranslations(slug: string): Observable<string[]> {
    return this.getState().pipe(
      map((_state: any) => {
        const langs = Object.keys(_state.pages).filter((lang) => {
          return (slug in _state.pages[lang]);
        });

        return langs;
      })
    );
  }

  /*
  *  Words per minute:
  *  The definition of each "word" is often standardized to be five characters 
  *  or keystrokes long in English.
  *  The number of characters per minute tends to be around 1000. 
  *  https://en.wikipedia.org/wiki/Words_per_minute#Reading_and_comprehension
  */
  getReadingTime(s: string) {
    /*
    // Method 1:
    // Using The number of characters per minute tends to be around 1000. 
    const avgcpm = 1000;
    const sc = s.length;
    const minutes = sc / avgcpm;
    */
    // Method 2:
    // Average speed 184 wpm
    const avgwpm = 184;
    const wordsize = 5;
    const sc = s.length;
    const numwords = Math.round(sc / wordsize);
    const minutes = numwords / avgwpm;

    return minutes;
  }

  /*
  *  @dev Get the list of all pages from full state contract
  * @param _numPages: -1 returns all values
  */
  getAllPagesFromLocalState(
    _langCode: string,
    _numPages: number = -1
  ): any {
    const _state = this._state;
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
  
  }

  /*
  *  @dev Get Categories
  */
  getCategoriesFromLocal(): ArwikiCategoryIndex {
    const state = this._state;
    return {...state.categories};
  }

  /*
  *  @dev Get Lang
  */
  getLanguagesFromLocal(): ArwikiLangIndex {
    const state = this._state;
    return {...state.languages};
  }

  /*
  *  @dev Get balances
  */
  getBalancesFromLocal(): { balances: any, vault: any, stakes: any } {
    const state = {...this._state};
    return { balances: { ...state.balances }, vault: { ...state.vault }, stakes: { ...state.stakes } };
  }

  /*
  *  @dev Get all balances variables
  */
  getTokenNameAndTicker(): Observable<any> {
    return this.getState().pipe(
      map((_state: any) => {
        const res = {
          'name': _state.name,
          'ticker': _state.ticker
        };
        return res;
      })
    );
  }

  /*
  *  @dev Execute read function on PST contract
  */
  getVotes(reload: boolean = false): Observable<ArwikiVote[]> {
    return this.getState(reload).pipe(
      map((_state: any) => {
        const votes = _state.votes;
        return votes;
      })
    );
  }

}