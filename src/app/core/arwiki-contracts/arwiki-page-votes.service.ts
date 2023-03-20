import { Injectable } from '@angular/core';
import { ArwikiTokenContract } from './arwiki-token.service';
import { WarpContractsService } from '../warp-contracts.service';
import { Observable, map } from 'rxjs';
import { ArwikiPageIndex } from '../interfaces/arwiki-page-index';
import { ArweaveService } from '../arweave.service';

@Injectable({
  providedIn: 'root'
})
export class ArwikiPageVotesService {

  
  constructor(
    private _arwikiToken: ArwikiTokenContract,
    private _warp: WarpContractsService,
    private _arweave: ArweaveService,) { }

  
  /*
  * @dev Upvote/downvote page
  */
  // Deprecated
  votePage(
    _target: string,
    _qty: string,
    _lang: string,
    _slug: string,
    _vote: boolean,
    _privateKey: any,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'VotePageAndDonate'},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'votePage',
      langCode: _lang,
      slug: _slug,
      vote: _vote,
    };
    _qty = this._arweave.arToWinston(_qty);
    const transfer = {target: _target, winstonQty: _qty};
    const strict = true;
    const disableBundler = true;
    return this._warp.writeInteraction(
      this._arwikiToken.contractAddress, jwk, input, tags, transfer, strict, disableBundler
    );
  }
}
