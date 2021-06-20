import { 
	readContract, interactWrite, interactRead, interactWriteDryRun, loadContract
} from 'smartweave';
import { Injectable } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { ArweaveService } from '../arweave.service';
import { map } from 'rxjs/operators';
import { JWKInterface } from 'arweave/node/lib/wallet';

@Injectable({
  providedIn: 'root'
})
export class ArwikiTokenContract
{
	private _contractAddress: string = 'yoOIYhcCnSl4giMLIk0WuF84oTHFdXNL1B4EmbQ7HcY';
	private _state: any = {};
	private _adminList: string[] = [];

	get contractAddress() {
		return this._contractAddress;
	}

	constructor(private _arweave: ArweaveService) {
	}

	deployNewContract() {
		
	}

	/*
	*	@dev Get full contract state as Observable
	*/
	getState(reload: boolean = false): Observable<any> {
		const obs = new Observable<any>((subscriber) => {
			if (Object.keys(this._state).length > 0 && !reload) {
				subscriber.next(this._state);
				subscriber.complete();
			} else {
				readContract(this._arweave.arweave, this._contractAddress)
					.then((state: any) => {
						this._state = state;
						this._adminList = Object.keys(state.roles).filter((address) => {
							return state.roles[address].toUpperCase() === 'MODERATOR';
						});

						subscriber.next(state);
						subscriber.complete();
					}).catch((error) => {
						subscriber.error(error);
					});
			}

		});

		return obs;
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
	getBalance(address: string, reload: boolean = true): Observable<any> {
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
  * @dev All pages needs to be validated first 
  * to be listed on the Arwiki. Validations are special TXs
  * with custom tags (Arwiki-Type: Validation)
  */
  async approvePage(
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

    const tx = await interactWrite(
      this._arweave.arweave,
      jwk,
      this._contractAddress,
      input,
      tags
    );
    return tx;
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
					return _state.pages[_langCode][slug].active;
				});
				const pages = pagesIds.reduce((acum: any, slug) => {
					acum[slug] = _state.pages[_langCode][slug];
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
    for (const vPage of Object.keys(stakingDict)) {
      stakingBalance += stakes[target][vPage];
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
					acum[slug] = _state.pages[_langCode][slug];
					return acum;
				}, {});
				return pages;
			})
		);
	}

	/*
  * @dev Claim reward function if available
  */
  async claimReward(
    _target: string,
    _slug: string,
    _langCode: string,
    _privateKey: any,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
    	{name: 'Service', value: 'ArWiki'},
    	{name: 'Arwiki-Type', value: 'ClaimReward'},
    	{name: 'Arwiki-Page-Slug', value: _slug},
    	{name: 'Arwiki-Page-Lang', value: _langCode},
    	{name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
    	function: 'unlockPageReward',
    	target: _target,
    	langCode: _langCode,
    	slug: _slug
    };

    const tx = await interactWrite(
      this._arweave.arweave,
      jwk,
      this._contractAddress,
      input,
      tags
    );
    return tx;
  }

  /*
  * @dev Stop stake and sponsorship
  */
  async stopStake(
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

    const tx = await interactWrite(
      this._arweave.arweave,
      jwk,
      this._contractAddress,
      input,
      tags
    );
    return tx;
  }

}