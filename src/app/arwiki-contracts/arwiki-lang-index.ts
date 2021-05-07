import { 
	readContract, interactWrite,
	createContract, interactRead
} from 'smartweave';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ArweaveService } from '../core/arweave.service';
import { ArwikiLangIndex } from '../core/interfaces/arwiki-lang-index';

@Injectable({
  providedIn: 'root'
})
export class ArwikiLangIndexContract
{
	private _langs: ArwikiLangIndex = {};
	private _contractAddress: string = 'PRYAbIYJYEnmJdePVf5Vz_Yumm9We6MvP3dWUwAwXlg';

	constructor(private _arweave: ArweaveService) {

	}
	/*
	*	@dev Get full contract state as Observable
	*/
	getState(): Observable<ArwikiLangIndex> {
		const obs = new Observable<ArwikiLangIndex>((subscriber) => {
			readContract(this._arweave.arweave, this._contractAddress)
				.then((state: ArwikiLangIndex) => {
					subscriber.next(state);
					subscriber.complete();
				}).catch((error) => {
					subscriber.error(error);
				});

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