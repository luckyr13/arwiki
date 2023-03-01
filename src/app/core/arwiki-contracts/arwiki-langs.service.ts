import { Injectable } from '@angular/core';
import { ArwikiTokenContract } from './arwiki-token.service';
import { WarpContractsService } from '../warp-contracts.service';
import { JWKInterface } from 'arweave/web/lib/wallet';
import { ArwikiLang } from '../interfaces/arwiki-lang';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArwikiTokenLangsService {
  constructor(
    private _arwikiToken: ArwikiTokenContract,
    private _warp: WarpContractsService) { }


  /*
  *  @dev Execute read function on PST contract
  */
  getLangs(reload: boolean = false): Observable<Record<string, ArwikiLang>> {
    return this._arwikiToken.getState(reload).pipe(
      map((_state: any) => {
        const langs = _state.languages;
        return {...langs};
      })
    );
  }


}
