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
	private _langs: any = {
		"en": {
			"code": "en",
			"iso_name": "English",
			"native_name": "English",
			"writing_system": "LTR",
			"contract": "YVKvK-MrbBJRnxpkdvK6sj3aqvK59t3Ax6xDcu9FWCE"
		},
		"es": {
			"code": "es",
			"iso_name": "Spanish",
			"native_name": "Español",
			"writing_system": "LTR",
			"contract": ""
		},
		"de": {
			"code": "de",
			"iso_name": "German",
			"native_name": "Deutsch",
			"writing_system": "LTR",
			"contract": ""
		},
		"hi": {
			"code": "hi",
			"iso_name": "Hindi",
			"native_name": "हिन्दी, हिंदी",
			"writing_system": "LTR",
			"contract": ""
		},
		"ar": {
			"code": "ar",
			"iso_name": "Arabic",
			"native_name": "العربية",
			"writing_system": "RTL",
			"contract": ""
		},
		"he": {
			"code": "he",
			"iso_name": "Hebrew",
			"native_name": "עברית",
			"writing_system": "RTL",
			"contract": ""
		}
	};

  // private _contractAddress: string = 'nj8kwCIDSiuv07GwTvLCcRIccjmbomoHO2r6dfyvsuM';
	private _contractAddress: string = 'lhStQhis30UBhSELWaGGd58DmERSdfnIl_zGoyBP1S0';

	constructor() {

	}
	/*
	*	@dev Get full contract state as Observable
	*/
	getState(arweave: any): Observable<any> {
		const obs = new Observable((subscriber) => {
			readContract(arweave, this._contractAddress).then((state) => {
				this._langs = state;
				subscriber.next(state);
				subscriber.complete();
			}).catch((error) => {
				subscriber.error(error);
			});

		});

		return obs;
	}

	/*
	*	@dev Alternative to getSubjects
	*/
	getLangsLocalCopy() {
		const obs = new Observable<any[]>((subscriber) => {
			try {
				subscriber.next(this._langs);
				subscriber.complete();
			} catch (error) {
				subscriber.error(error);
			}
		});

		return obs;
	}


}