import { Injectable } from '@angular/core';
import { ArwikiTokenContract } from './arwiki-token.service';
import { WarpContractsService } from '../warp-contracts.service';
import { Observable, map } from 'rxjs';
import { ArweaveService } from '../arweave.service';
import { arwikiVersion, serviceName } from './arwiki';

@Injectable({
  providedIn: 'root'
})
export class ArwikiPageSponsorService {

  constructor(
    private _arwikiToken: ArwikiTokenContract,
    private _warp: WarpContractsService,
    private _arweave: ArweaveService,) { }

  /*
  * @dev Stop stake and sponsorship
  */
  stopStaking(
    _slug: string,
    _langCode: string,
    _privateKey: any,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: serviceName},
      {name: 'Arwiki-Type', value: 'StopStake'},
      {name: 'Arwiki-Page-Slug', value: _slug},
      {name: 'Arwiki-Page-Lang', value: _langCode},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'stopPageSponsorshipAndDeactivatePage',
      langCode: _langCode,
      slug: _slug
    };

    return this._warp.writeInteraction(
      this._arwikiToken.contractAddress, jwk, input, tags
    );
  }

  /*
  * @dev Update sponsor
  * Note: This can reactivate an inactive page
  */
  updatePageSponsor(
    _slug: string,
    _category: string,
    _langCode: string,
    _pageValue: number,
    _privateKey: any,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: serviceName},
      {name: 'Arwiki-Type', value: 'UpdateSponsor'},
      {name: 'Arwiki-Page-Slug', value: _slug},
      {name: 'Arwiki-Page-Category', value: _category},
      {name: 'Arwiki-Page-Lang', value: _langCode},
      {name: 'Arwiki-Page-Value', value: `${_pageValue}`},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'updatePageSponsor',
      langCode: _langCode,
      slug: _slug,
      pageValue: `${_pageValue}`
    };

    return this._warp.writeInteraction(
      this._arwikiToken.contractAddress, jwk, input, tags
    );
  }
}
