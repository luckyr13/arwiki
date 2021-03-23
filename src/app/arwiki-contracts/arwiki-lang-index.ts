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
		"langs": {
			"en": {
				"iso_name": "English",
				"numPages": 0,
				"writing_system": "LTR",
				"contract": ""
			},
			"es": {
				"iso_name": "Spanish",
				"numPages": 0,
				"writing_system": "LTR",
				"contract": ""
			},
			"de": {
				"iso_name": "German",
				"numPages": 0,
				"writing_system": "LTR",
				"contract": ""
			},
			"hi": {
				"iso_name": "Hindi",
				"numPages": 0,
				"writing_system": "LTR",
				"contract": ""
			}
		}
	};


	//private _contractAddress: string = 'zv0ZJNpT9-JrOld8XPc05shHXIQFWKER_J_7zXvviXA';
  //private _contractAddress: string = 'Hqh131ZCJkSnUO2t9PAnnOCW5seSUkUFLk8goL76p7A';
  // private _contractAddress: string = 'KeST6o6RP0uJXHDPUpFmv7UJOrRDa_Q4vifnuY-wUFg';
  // 
  private _contractAddress: string = 'AFOZPETPbNHOk8J49DojBfEtEN_GuobL00dp5seSxZQ';
	constructor() {

	}
	/*
	*	@dev Get full contract state as Observable
	*/
	getState(arweave: any): Observable<any> {
		const obs = new Observable((subscriber) => {
			readContract(arweave, this._contractAddress).then((state) => {
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