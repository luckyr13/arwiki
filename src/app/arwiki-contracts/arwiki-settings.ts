import { 
	readContract, interactWrite,
	createContract, interactRead
} from 'smartweave';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ArweaveService } from '../core/arweave.service';
import { ArwikiSettings } from '../core/interfaces/arwiki-settings';
import { ArwikiAdminList } from '../core/interfaces/arwiki-admin-list';

@Injectable({
  providedIn: 'root'
})
export class ArwikiSettingsContract
{
	private _contractAddress: string = 'GYJbXQlAL7pMtdlPCTy1d_M6qm4dpPhvnln5MTuvTiM';

	constructor(private _arweave: ArweaveService) {
	}

	/*
	*	@dev Get full contract state as Observable
	*/
	getState(): Observable<ArwikiSettings> {
		const obs = new Observable<ArwikiSettings>((subscriber) => {
			readContract(this._arweave.arweave, this._contractAddress)
				.then((state: ArwikiSettings) => {
					subscriber.next(state);
					subscriber.complete();
				}).catch((error) => {
					subscriber.error(error);
				});

		});

		return obs;
	}

	/*
	*	@dev Get only the admin list from full state contract
	*/
	getAdminList(): Observable<ArwikiAdminList> {
		const obs = new Observable<ArwikiAdminList>((subscriber) => {
			readContract(this._arweave.arweave, this._contractAddress)
				.then((state: ArwikiSettings) => {
					const admin_list: ArwikiAdminList = state.admin_list ? state.admin_list : {};
					subscriber.next(admin_list);
					subscriber.complete();
				}).catch((error) => {
					subscriber.error(error);
				});

		});

		return obs;
	}

	/*
	*	@dev Get only the admin list from full state contract
	*/
	isAdmin(address: string): Observable<boolean> {
		const obs = new Observable<boolean>((subscriber) => {
			readContract(this._arweave.arweave, this._contractAddress).then((state) => {
				const admin_list = state.admin_list ? state.admin_list : [];
				const isAdmin = admin_list.indexOf(address) >= 0;
				subscriber.next(isAdmin);
				subscriber.complete();
			}).catch((error) => {
				subscriber.error(error);
			});

		});

		return obs;
	}


	/*
	*	@dev Register new admin address in contract
	*/
	registerAdmin(walletJWK: any, address: string): Observable<any>  {
		const obs = new Observable((subscriber) => {
			const input = { function: 'addAdmin', new_admin: address };
			interactWrite(this._arweave.arweave, walletJWK, this._contractAddress, input)
				.then((tx) => {
					subscriber.next(tx);
					subscriber.complete();
				}).catch((error) => {
					subscriber.error(error);
				});

		});

		return obs;
	}

}