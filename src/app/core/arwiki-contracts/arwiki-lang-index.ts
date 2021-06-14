import { 
	readContract, interactWrite,
	createContract, interactRead
} from 'smartweave';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ArweaveService } from '../arweave.service';
import { ArwikiLangIndex } from '../interfaces/arwiki-lang-index';

@Injectable({
  providedIn: 'root'
})
export class ArwikiLangIndexContract
{
	private _langs: ArwikiLangIndex = {};
	private _contractAddress: string = 'HNn0zHrdsoTFlXe7LQXVoZNi507QI0L4lFNhp7DUT60';


	constructor(private _arweave: ArweaveService) {

	}
	/*
	*	@dev Get full contract state as Observable
	*/
	getState(): Observable<ArwikiLangIndex> {
		const obs = new Observable<ArwikiLangIndex>((subscriber) => {
			if (Object.keys(this._langs).length > 0) {
				subscriber.next(this._langs);
				subscriber.complete();
			} else {
				readContract(this._arweave.arweave, this._contractAddress)
					.then((state: ArwikiLangIndex) => {
						this._langs = state;
						subscriber.next(state);
						subscriber.complete();
					}).catch((error) => {
						subscriber.error(error);
					});
			}
		});
		return obs;
	}

	getLangsLocalCopy(): ArwikiLangIndex {
		return this._langs;
	}

	/*
	*	@dev Alternative to getSubjects
	*/
	setLangsLocalCopy(langs: ArwikiLangIndex) {
		this._langs = langs;
	}

}