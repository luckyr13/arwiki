import { Injectable } from '@angular/core';
import { Observable, of, from, switchMap } from 'rxjs';
import { ArweaveService } from '../arweave.service';
import { map, tap } from 'rxjs/operators';
import { JWKInterface } from 'arweave/node/lib/wallet';
import { FromSrcTxContractData, ArWallet } from 'warp-contracts';
import { WarpContractsService } from '../warp-contracts.service';
import { UtilsService } from '../utils.service';
import { serviceName } from '../arwiki';

@Injectable({
  providedIn: 'root'
})
export class ArwikiAtomicNftService
{
  private readonly _nftContractSrc = 'DyHtOIQToIUedjKBOZEa8Zo8bxkyAIVWGpbXUyHXddA';

  constructor(
    private _arweave: ArweaveService,
    private _warp: WarpContractsService,
    private _utils: UtilsService
  ) { }

  /*
  *  @dev Get full contract state as Observable
  */
  getState(contractAddress: string): Observable<any> {
    const obs = new Observable<any>((subscriber) => {
      this._warp.readState(contractAddress).subscribe({
        next: (res) => {
          const cachedValue = res.cachedValue;
          const sortKey = res.sortKey;
          const state = cachedValue &&
            Object.prototype.hasOwnProperty.call(cachedValue, 'state') ?
            cachedValue.state : {};

          //this._adminList = Object.keys(this._state.roles).filter((address) => {
          //  return this._state.roles[address].toUpperCase() === 'MODERATOR';
          //});

          subscriber.next(state);
          subscriber.complete();
        }, error: (err) => {
          subscriber.error(err);
        }
      });

      return { unsubscribe() { } };

    });

    return obs;
  }

  transfer(
    target: string,
    qty: number,
    contractAddress: string,
    jwk: JWKInterface|'use_wallet',
    arwikiVersion: string) {
    const tags = [
      {name: 'Service', value: serviceName},
      {name: 'Arwiki-Type', value: 'TransferTokens'},
      {name: 'Arwiki-Version', value: arwikiVersion[0]},
    ];
    
    const input = {
      function: 'transfer',
      target: target,
      qty: qty,
    };
    
    return this._warp.writeInteraction(
      contractAddress, jwk, input, tags
    );
  }

  /*
  *  How to create a Tradeable Atomic PST|NFT|TX:
  *  https://arweave.net/ek0exy7E8hV_CMq__vW614FIgkbjPwcllknCKiQpOTo
  */
  createNFT(
    target: string,
    qty: number,
    linkedContractAddress: string,
    title: string,
    langCode: string,
    slug: string,
    img: string,
    jwk: JWKInterface|'use_wallet',
    method: string,
    createdAt: number,
    disableBundling?: boolean
  ) {
    if (!img) {
      throw new Error('NFT must have an img');
    }
    const description = `ArWiki page: https://arwiki.wiki/#/${langCode}/${slug}`;
    const wallet: ArWallet = jwk;
    const initialState = JSON.stringify({
      balances: {
        [target]: qty
      },
      title: title,
      name: `${langCode}/${slug}`,
      description: description,
      ticker: `ARWIKI_${langCode}_${slug}`,
      createdAt: createdAt,
      linkedContract: linkedContractAddress,
      linkedProperties: {
        slug: slug,
        langCode: langCode
      }
    });
    const manifest =  JSON.stringify({
      manifest: "arweave/paths",
      version: "0.1.0",
      index: {
        path: "asset"
      },
      paths: {
        asset: {
          id: img
        }
      }
    });

    const tags: {name: string; value: string;}[] = [
      { name: 'Type', value: 'image' },
      { name: 'Title', value: title },
      { name: 'Description', value: description }
    ];

    const contract: FromSrcTxContractData = {
      srcTxId: this._nftContractSrc,
      initState: initialState,
      wallet: wallet,
      tags: tags,
      data: { 'Content-Type': 'application/x.arweave-manifest+json', body: manifest }
    };

    if (!disableBundling) {
      return from(this._arweave.getUserSigner(method)).pipe(
        switchMap((wallet) => {
          if (wallet) {
            contract.wallet = wallet;
          }
          return this._warp.createContractFromTX(contract, disableBundling);
        })
      );
    }

    return this._warp.createContractFromTX(contract, disableBundling);

  }



}