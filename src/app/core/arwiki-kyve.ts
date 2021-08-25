import ArDB from 'ardb';
import Arweave from 'arweave';
import { arwikiVersion } from './arwiki';
import { Observable, of, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Query } from "@kyve/query";

export class ArwikiKYVE {
	private _ardb: ArDB;
	private _arweave: Arweave;
	private _query: Query;
	private _poolID: string = 'KXeqPReolrKuSKCqFaemdt4hGzp9F5FdzpdZnoPW-Gs';

	constructor(
    _arweave: Arweave
  ) {
		this._ardb = new ArDB(_arweave);
		this._arweave = _arweave;
		this._query = new Query(this._poolID);
	}

	getLastStates() {
		// finding latest transactions
		return from(this._query.find());
	}

}