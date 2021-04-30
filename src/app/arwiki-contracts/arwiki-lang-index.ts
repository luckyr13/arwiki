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
export class ArwikiLangIndexContract
{
	private _langs: any = {};
	//private _contractAddress: string = 'ZVFnlF671UqgGTdExivbOP0f9gTDWQpkY26nBaRhcYM';
	private _contractAddress: string = 'dJVI2Cz5ldYM5_VSM-6QO1xdWGEux7Qae5EeWe58O1g';

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