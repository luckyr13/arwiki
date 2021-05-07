import { 
	readContract, interactWrite,
	createContract, interactRead
} from 'smartweave';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ArweaveService } from '../core/arweave.service';
import { ArwikiCategoryIndex } from '../core/interfaces/arwiki-category-index';

@Injectable({
  providedIn: 'root'
})
export class ArwikiCategoriesContract
{
	private _contractAddress: string = 'YLQ-SyFFb83S41qnivAyhvY6PW79o1ArTy6ijpBEWWA';

	constructor(private _arweave: ArweaveService) {
	}
	/*
	*	@dev Get full contract state as Observable
	*/
	getState(): Observable<ArwikiCategoryIndex> {
		const obs = new Observable<ArwikiCategoryIndex>((subscriber) => {
			readContract(this._arweave.arweave, this._contractAddress)
				.then((state: ArwikiCategoryIndex) => {
					subscriber.next(state);
					subscriber.complete();
				}).catch((error) => {
					subscriber.error(error);
				});

		});

		return obs;
	}

}