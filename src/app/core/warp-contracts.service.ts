import { Injectable } from '@angular/core';
import { 
  Warp, Contract, WarpFactory,
  EvalStateResult, LoggerFactory, ConsoleLoggerFactory,
  ArWallet, Tags, ArTransfer,
  WriteInteractionResponse  } from 'warp-contracts'
import { ArweaveService } from './arweave.service';
import { Observable, from } from 'rxjs';
import { SortKeyCacheResult } from 'warp-contracts/lib/types/cache/SortKeyCache';

@Injectable({
  providedIn: 'root'
})
export class WarpContractsService {
  private readonly _warp: Warp;

  constructor(_arweave: ArweaveService) {
    LoggerFactory.use(new ConsoleLoggerFactory());
    LoggerFactory.INST.logLevel('fatal');
    this._warp = WarpFactory.forMainnet(undefined, undefined, _arweave.arweave);
  }

  get warp(): Warp {
    return this._warp;
  }

  readState(contractAddress: string): Observable<SortKeyCacheResult<EvalStateResult<unknown>>> {
    const contract = this._warp.contract(contractAddress);
    return from(contract.readState());
  }

  writeInteraction(
    contractAddress: string,
    jwk: ArWallet,
    input: any,
    tags?: Tags,
    transfer?: ArTransfer,
    strict: boolean = true,
    disableBundling = false): Observable<WriteInteractionResponse | null> {
    const contract = this._warp
      .contract(contractAddress)
      .connect(jwk)
      .setEvaluationOptions({
        // with this flag set to true, the write will wait for the transaction to be confirmed
        waitForConfirmation: false,
      });
    const options = { tags: tags, strict: strict, transfer: transfer, disableBundling: disableBundling };

    return from(contract.writeInteraction(input, options));
  }
}
