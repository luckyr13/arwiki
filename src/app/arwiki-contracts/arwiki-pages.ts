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
	private _contractAddress: string = 'YVKvK-MrbBJRnxpkdvK6sj3aqvK59t3Ax6xDcu9FWCE';

	constructor() {
	}



	/*
	*	@dev Get full contract state as Observable
	*/
	getState(arweave: any, contractAddress: string = ''): Observable<any> {
		const finalContract = contractAddress ? 
			contractAddress : this._contractAddress;
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

	/*
	*	@dev Insert page into arwiki index
	*/
	addArWikiPageIntoIndex(
		arweave: any,
		walletJWK: any,
		slug: string,
		content_id: string,
		category_slug: string
	): Observable<any> {
		const obs = new Observable((subscriber) => {
			const input = {
				function: 'addPage',
	  		slug: slug,
	  		content_id: content_id,
	  		category_slug: category_slug
			};

			interactWrite(arweave, walletJWK, this._contractAddress, input)
				.then((result) => {
					subscriber.next(result);
					subscriber.complete();
				}).catch((error) => {
					subscriber.error(error);
				});
		});

		return obs;
	}

}