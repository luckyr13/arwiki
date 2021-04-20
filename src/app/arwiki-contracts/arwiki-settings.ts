import { 
	readContract, interactWrite,
	createContract, interactRead
} from 'smartweave';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ArweaveService } from '../core/arweave.service';

@Injectable({
  providedIn: 'root'
})
export class ArwikiSettingsContract
{
	private _contractAddress: string = 'sGOPfJMI_TyQ632y1T0DwWNf6IPKRU9-tguBx0h8g9Q';

	constructor(private _arweave: ArweaveService) {
	}

	/*
	*	@dev Get full contract state as Observable
	*/
	getState(): Observable<any> {
		const obs = new Observable((subscriber) => {
			readContract(this._arweave.arweave, this._contractAddress).then((state) => {
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
	getAdminList(): Observable<any> {
		const obs = new Observable((subscriber) => {
			readContract(this._arweave.arweave, this._contractAddress).then((state) => {
				const admin_list = state.admin_list ? state.admin_list : [];
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