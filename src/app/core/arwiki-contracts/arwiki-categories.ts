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
	private _contractAddress: string = 'P2S3XXexvWQ7hblD5yzB3eM1-VK8YYuQj3GdkI-vfeg';
	private _state: ArwikiCategoryIndex = {};
	private _localState: ArwikiCategoryIndex = {
		"the_arweave_project": {
			"slug": "the_arweave_project",
			"label": "The Arweave Project",
			"order": 10,
			"active": true
		},
		"the_arweave_protocol": {
			"slug": "the_arweave_protocol",
			"label": "The Arweave Protocol",
			"order": 20,
			"active": true
		},
		"profit_sharing": {
			"slug": "profit_sharing",
			"label": "Profit Sharing",
			"order": 30,
			"active": true
		},
		"mining": {
			"slug": "mining",
			"label": "Mining",
			"order": 40,
			"active": true
		},
		"building_on_arweave": {
			"slug": "building_on_arweave",
			"label": "Building on Arweave",
			"order": 50,
			"active": true
		},
		"resources": {
			"slug": "resources",
			"label": "Resources",
			"order": 100,
			"active": true
		}
	};

	constructor(private _arweave: ArweaveService) {
	}

	getState(): Observable<ArwikiCategoryIndex> {
		const obs = new Observable<ArwikiCategoryIndex>((subscriber) => {
			this._state = this._localState;
			subscriber.next(this._localState);
			subscriber.complete();
		});

		return obs;
	}

	/*
	*	@dev Get full contract state as Observable
	*/
	getState_old(): Observable<ArwikiCategoryIndex> {
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