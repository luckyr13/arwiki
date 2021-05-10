import { 
	readContract, interactWrite,
	createContract, interactRead
} from 'smartweave';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ArweaveService } from '../arweave.service';
import { ArwikiCategoryIndex } from '../interfaces/arwiki-category-index';

@Injectable({
  providedIn: 'root'
})
export class ArwikiCategoriesContract
{
	private _contractAddress: string = 'bgSBpu_BVJrV-nf_-mUe0oXRpXFO-Sqx2VYVJ_YL3rc';
	private _state: ArwikiCategoryIndex = {};

	constructor(private _arweave: ArweaveService) {
	}
	/*
	*	@dev Get full contract state as Observable
	*/
	getState(): Observable<ArwikiCategoryIndex> {
		const obs = new Observable<ArwikiCategoryIndex>((subscriber) => {
			if (Object.keys(this._state).length > 0) {
				subscriber.next(this._state);
				subscriber.complete();
			} else {
				readContract(this._arweave.arweave, this._contractAddress)
					.then((state: ArwikiCategoryIndex) => {
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