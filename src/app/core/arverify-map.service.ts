import { getVerification } from "arverify";
import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class ArverifyMapService {
	_arverifyMap: any = {}

	constructor() {}

	async getVerification(address: string) {
		if (!this._arverifyMap[address]) { 
			this._arverifyMap[address] = getVerification(address)
		}
		return this._arverifyMap[address]
	}
}
