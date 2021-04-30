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
export class ArwikiCategoriesContract
{
	// private _contractAddress: string = 'v-G-YU3rlqgPnSHGSoNXrAWCF1_Cvh4v6SUKfkgaxtE';
	private _contractAddress: string = 'RvmscA9yGSrhgC6t7m-ODtPToPqAg9AUrzB6DzoDM4w';
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

}