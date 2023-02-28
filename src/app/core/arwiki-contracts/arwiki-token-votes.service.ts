import { Injectable } from '@angular/core';
import { ArwikiTokenContract } from './arwiki-token.service';
import { WarpContractsService } from '../warp-contracts.service';
import { JWKInterface } from 'arweave/web/lib/wallet';


@Injectable({
  providedIn: 'root'
})
export class ArwikiTokenVotesService {
  constructor(
    private _arwikiToken: ArwikiTokenContract,
    private _warp: WarpContractsService) { }

  addVoteMintTokens(
    _recipient: string,
    _qty: number,
    _lockLength: number,
    _note: string,
    _privateKey: JWKInterface|'use_wallet',
    _arwikiVersion: string
  ) {
    let type = '';
    if (!_lockLength) {
      type = 'mint';
    } else {
      type = 'mintLocked';
    }
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'VoteProposal'},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'propose',
      type: type,
      note: _note,
      recipient: _recipient,
      qty: _qty,
      lockLength: _lockLength
    };
    
    return this._warp.writeInteraction(
      this._arwikiToken.contractAddress, jwk, input, tags
    );
  }


  addVoteBurnVault(
    _target: string,
    _note: string,
    _privateKey: JWKInterface|'use_wallet',
    _arwikiVersion: string
  ) {
    const type = 'burnVault';
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'VoteProposal'},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'propose',
      type: type,
      note: _note,
      target: _target
    };
    
    return this._warp.writeInteraction(
      this._arwikiToken.contractAddress, jwk, input, tags
    );
  }

}
