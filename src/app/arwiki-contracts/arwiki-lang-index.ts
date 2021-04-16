import { 
	readContract, interactWrite,
	createContract, interactRead
} from 'smartweave';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ArwikiLangIndexContract
{
	private _langs: any = {};

  // private _contractAddress: string = 'nj8kwCIDSiuv07GwTvLCcRIccjmbomoHO2r6dfyvsuM';
	// private _contractAddress: string = 'lhStQhis30UBhSELWaGGd58DmERSdfnIl_zGoyBP1S0';
	private _contractAddress: string = 'tx4KgtqF8h_z7gu80-H1GkwY5T3WnjJNBpmmA2evgPI';

	constructor() {

	}
	/*
	*	@dev Get full contract state as Observable
	*/
	getState(arweave: any): Observable<any> {
		const obs = new Observable((subscriber) => {
			readContract(arweave, this._contractAddress).then((state) => {
				subscriber.next(state);
				subscriber.complete();
			}).catch((error) => {
				subscriber.error(error);
			});

		});
		return obs;
	}

	getLangsLocalCopy() {
		return this._langs;
	}

	/*
	*	@dev Alternative to getSubjects
	*/
	setLangsLocalCopy(langs: any) {
		this._langs = langs;
	}

}