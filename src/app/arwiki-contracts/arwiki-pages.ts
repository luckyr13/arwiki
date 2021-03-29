import { 
	readContract, interactWrite,
	createContract, interactRead
} from 'smartweave';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ArwikiPagesContract
{
	private _contractAddressDefaultLang: string = 'xnlTVtwU-fF8ModDyQy48Ed6k6FSFBL7yF_PtcT8zmk';

	constructor() {
	}



	/*
	*	@dev Get full contract state as Observable
	*/
	getState(arweave: any, contractAddress: string = ''): Observable<any> {
		const finalContract = contractAddress ? 
			contractAddress : this._contractAddressDefaultLang;
		const obs = new Observable((subscriber) => {
			readContract(arweave, finalContract).then((state) => {
				subscriber.next(state);
				subscriber.complete();
			}).catch((error) => {
				subscriber.error(error);
			});

		});

		return obs;
	}

}