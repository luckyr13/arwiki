import { Injectable } from '@angular/core';
import { ArwikiTokenContract } from './arwiki-token.service';
import { WarpContractsService } from '../warp-contracts.service';
import { Observable, map } from 'rxjs';
import { ArwikiPageIndex } from '../interfaces/arwiki-page-index';
import { ArweaveService } from '../arweave.service';
import { arwikiVersion, serviceName } from './arwiki';

@Injectable({
  providedIn: 'root'
})
export class ArwikiPageUpdatesService {

  constructor(
    private _arwikiToken: ArwikiTokenContract,
    private _warp: WarpContractsService,
    private _arweave: ArweaveService,) { }


  /*
  * @dev All pages updates needs to be validated first 
  * to be listed on the Arwiki. Validations are special TXs
  * with custom tags (Arwiki-Type: Validation)
  */
  approvePageUpdate(
    _pageId: string,
    _author: string,
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
      {name: 'Arwiki-Type', value: 'PageUpdateValidation'},
      {name: 'Arwiki-Page-Id', value: _pageId},
      {name: 'Arwiki-Page-Slug', value: _slug},
      {name: 'Arwiki-Page-Category', value: _category},
      {name: 'Arwiki-Page-Lang', value: _langCode},
      {name: 'Arwiki-Page-Value', value: `${_pageValue}`},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'addPageUpdate',
      updateTX: _pageId,
      langCode: _langCode,
      slug: _slug,
      author: _author,
      pageValue: _pageValue,
      category: _category
    };

    return this._warp.writeInteraction(
      this._arwikiToken.contractAddress, jwk, input, tags
    );
  }

  /*
  * @dev Pending updates can be rejected
  * if an admin creates a Reject TX (Arwiki-Type: PageUpdateRejected)
  */
  async createRejectTXForArwikiPageUpdate(
    _pageId: string,
    _slug: string,
    _langCode: string,
    _reason: string,
    _privateKey: any,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const data = `${_reason}`.trim();
    const tx = await this._arweave.arweave.createTransaction({
      data
    }, jwk);
    tx.addTag('Content-Type', 'text/plain');
    tx.addTag('Service', serviceName);
    tx.addTag('Arwiki-Type', 'PageUpdateRejected');
    tx.addTag('Arwiki-Page-Id', _pageId);
    tx.addTag('Arwiki-Page-Slug', _slug);
    tx.addTag('Arwiki-Page-Lang', _langCode);
    tx.addTag('Arwiki-Page-Reason', _reason);
    tx.addTag('Arwiki-Version', _arwikiVersion);
    await this._arweave.arweave.transactions.sign(tx, jwk);
    const response = await this._arweave.arweave.transactions.post(tx);
    if (response.status != 200) {
      throw Error(`Error ${response.statusText}`);
    }
    return tx.id;
  }
}
