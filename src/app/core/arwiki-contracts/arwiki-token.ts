import { 
	readContract, interactWrite,
	createContract, interactRead
} from 'smartweave';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ArweaveService } from '../arweave.service';

@Injectable({
  providedIn: 'root'
})
export class ArwikiTokenContract
{
	private _contractAddress: string = '4D75y3eG0USBZO2bq2PJtpe1f2f8rX7-K9UkE14HgPs';
	private _state: any = {};

	constructor(private _arweave: ArweaveService) {
	}

	deployNewContract() {
		
	}

	/*
	*	@dev Get full contract state as Observable
	*/
	getState(): Observable<any> {
		const obs = new Observable<any>((subscriber) => {
			if (Object.keys(this._state).length > 0) {
				subscriber.next(this._state);
				subscriber.complete();
			} else {
				readContract(this._arweave.arweave, this._contractAddress)
					.then((state: any) => {
						this._state = state;
						subscriber.next(state);
						subscriber.complete();
					}).catch((error) => {
						subscriber.error(error);
					});
			}

		});

		return obs;
	}

}