import { Injectable } from '@angular/core';
import { StampsState } from './interfaces/stamps-state';
import { Observable, from, catchError, of, tap } from 'rxjs';
import { HttpClient, HttpHeaders} from '@angular/common/http';

/*
*  Stamps Protocol service
*  Based on: https://arweave.net/MSqnfUogtkqDpTQYQDKIqAS4eMOhp8DfxUW-Hgs5TL0
*/

@Injectable({
  providedIn: 'root'
})
export class StampsService {
  public readonly STAMPCOIN = 'aSMILD7cEJr93i7TAVzzMjtci_sGkXcWnqpDkG6UGcA'
  public readonly CACHE = `https://cache.permapages.app/${this.STAMPCOIN}`;
  private _state: StampsState|null = null;

  constructor(private _http: HttpClient) { }

  public getState(): Observable<StampsState|null> {
    return this._http.get<StampsState>(this.CACHE).pipe(
        tap((state: StampsState)=> {
          if (state) {
            this._state = state;
          }
        }),
        catchError((error) => {
          /*
           warp.contract(STAMPCOIN)
          .setEvaluationOptions({
            allowUnsafeClient: true
          })
          .readState()
          */
          console.error('getState', error);
          return of(null);
        })
      );
  }

  public getStampCount(txId: string) {
    if (!this._state) {
      return 0;
    }
    const stamps = Object.values(this._state.stamps).filter(s => s.asset === txId);
    return stamps.length;
  }


}
