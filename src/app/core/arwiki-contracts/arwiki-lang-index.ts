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
	private _contractAddress: string = '-NZMPdQJd2P3N9pXzKh8mV_PljLzmYtjFnVRZ9uoUpM';
	private _localLangs: ArwikiLangIndex = {
	"en": {
		"code": "en",
		"iso_name": "English",
		"native_name": "English",
		"writing_system": "LTR",
		"active": true
	},
	"es": {
		"code": "es",
		"iso_name": "Spanish",
		"native_name": "Español",
		"writing_system": "LTR",
		"active": true
	},
	"de": {
		"code": "de",
		"iso_name": "German",
		"native_name": "Deutsch",
		"writing_system": "LTR",
		"active": true
	},
	"hi": {
		"code": "hi",
		"iso_name": "Hindi",
		"native_name": "हिन्दी, हिंदी",
		"writing_system": "LTR",
		"active": true
	},
	"ar": {
		"code": "ar",
		"iso_name": "Arabic",
		"native_name": "العربية",
		"writing_system": "RTL",
		"active": true
	},
	"he": {
		"code": "he",
		"iso_name": "Hebrew",
		"native_name": "עברית",
		"writing_system": "RTL",
		"active": true
	},
	"hu": {
		"code": "hu",
		"iso_name": "Hungarian",
		"native_name": "magyar",
		"writing_system": "LTR",
		"active": true
	},
	"ga": {
		"code": "ga",
		"iso_name": "Irish",
		"native_name": "Gaeilge",
		"writing_system": "LTR",
		"active": true
	},
	"zh": {
		"code": "zh",
		"iso_name": "Chinese",
		"native_name": "中文",
		"writing_system": "LTR",
		"active": true
	},
	"id": {
		"code": "id",
		"iso_name": "Indonesian",
		"native_name": "Bahasa Indonesia",
		"writing_system": "LTR",
		"active": true
	}
};



	constructor(private _arweave: ArweaveService) {
	}

	getState(): Observable<ArwikiLangIndex> {
		const obs = new Observable<ArwikiLangIndex>((subscriber) => {
			this._langs = this._localLangs;
			subscriber.next(this._localLangs);
			subscriber.complete();
		});

		return obs;
	}

	/*
	*	@dev Get full contract state as Observable
	*/
	getState_old(): Observable<ArwikiLangIndex> {
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