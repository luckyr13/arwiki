import Arweave from 'arweave';
import { arwikiVersion } from './arwiki';
import { Observable, of, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
//import KYVE from "@kyve/logic";

export class ArwikiKYVE {
	//private _ardb: ArDB;
	private _arweave: Arweave;
	// private _kyve!: KYVE;
	// private _poolID: string = 'KXeqPReolrKuSKCqFaemdt4hGzp9F5FdzpdZnoPW-Gs';

	constructor(
    _arweave: Arweave
  ) {
		//this._ardb = new ArDB(_arweave);
		this._arweave = _arweave;
		// this._query = new KYVE(this._poolID);
	}

	getLastStates() {
		// finding latest transactions
		// return from(this._query.find());
		return of([]);
	}

}