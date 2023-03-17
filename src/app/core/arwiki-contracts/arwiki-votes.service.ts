import { Injectable } from '@angular/core';
import { ArwikiTokenContract } from './arwiki-token.service';
import { WarpContractsService } from '../warp-contracts.service';
import { JWKInterface } from 'arweave/web/lib/wallet';
import { ArwikiVote } from '../interfaces/arwiki-vote';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArwikiVotesService {
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

  addVoteIndicative(
    _note: string,
    _privateKey: JWKInterface|'use_wallet',
    _arwikiVersion: string
  ) {
    const type = 'indicative';
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'VoteProposal'},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'propose',
      type: type,
      note: _note
    };
    
    return this._warp.writeInteraction(
      this._arwikiToken.contractAddress, jwk, input, tags
    );
  }

  addVoteSetSettings(
    _key: string,
    _note: string,
    _value: string|number,
    _recipient: string,
    _privateKey: JWKInterface|'use_wallet',
    _arwikiVersion: string
  ) {
    const type = 'set';
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'VoteProposal'},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'propose',
      type: type,
      key: _key,
      recipient: _recipient,
      value: _value,
      note: _note
    };
    
    return this._warp.writeInteraction(
      this._arwikiToken.contractAddress, jwk, input, tags
    );
  }

  /*
  *  @dev Execute read function on PST contract
  */
  getVotes(reload: boolean = false): Observable<ArwikiVote[]> {
    return this._arwikiToken.getState(reload).pipe(
      map((_state: any) => {
        const votes = _state.votes;
        return [...votes];
      })
    );
  }

  /*
  * @dev Finalize vote
  */
  finalizeVote(
    _voteId: number,
    _privateKey: any,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'FinalizeVote'},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'finalize',
      id: _voteId
    };
    return this._warp.writeInteraction(
      this._arwikiToken.contractAddress, jwk, input, tags
    );
  }

  /*
  * @dev Finalize vote
  */
  submitUserVote(
    _voteId: number,
    _vote: string,
    _privateKey: any,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'SubmitVote'},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'vote',
      id: _voteId,
      cast: _vote
    };
    return this._warp.writeInteraction(
      this._arwikiToken.contractAddress, jwk, input, tags
    );
  }

}
