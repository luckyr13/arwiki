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
	// private _contractAddress: string = 'v-G-YU3rlqgPnSHGSoNXrAWCF1_Cvh4v6SUKfkgaxtE';
	// private _contractAddress: string = 'RvmscA9yGSrhgC6t7m-ODtPToPqAg9AUrzB6DzoDM4w';
	private _contractAddress: string = '3FPEyMyLgdJPJ0eBbDUKJcmgl172Lvp88gQmKTaQ6fI';

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