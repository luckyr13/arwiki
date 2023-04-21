import { Injectable } from '@angular/core';
import Stamps, { StampJS, CountResult } from '@permaweb/stampjs';
import { Warp } from 'warp-contracts';
import { from, Observable } from 'rxjs';

/*
*  Stamps Protocol service
*  Based on: 
*    https://protocol_stamps.arweave.dev/
*    https://github.com/twilson63/stamp-protocol/tree/main/packages/stampjs
*/

@Injectable({
  providedIn: 'root'
})
export class StampsService {
  stamps: StampJS|null = null;

  constructor() { }

  init(warp: Warp) {
    // initialize - passing a warp instance
    this.stamps = Stamps.init({warp});
  }

  stamp(tx: string, qty: number, tags: {name: string, value:string}[]): Observable<any> {
    return from(this.stamps!.stamp(tx, qty, tags));
  }

  count(tx: string): Observable<CountResult> {
    return from(this.stamps!.count(tx));
  }

  counts(assets: string[]): Observable<CountResult[]> {
    return from(this.stamps!.counts(assets));
  }

  balance(address: string): Observable<number> {
    return from(this.stamps!.balance(address));
  }
}
