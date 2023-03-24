import { Injectable } from '@angular/core';
import { ArwikiTokenContract } from './arwiki-token.service';
import { WarpContractsService } from '../warp-contracts.service';
import { Observable, map } from 'rxjs';
import { ArweaveService } from '../arweave.service';

@Injectable({
  providedIn: 'root'
})
export class ArwikiAdminsService {
  private _adminList: string[] = [];

  constructor(
    private _arwikiToken: ArwikiTokenContract,
    private _warp: WarpContractsService,
    private _arweave: ArweaveService,) { }

  /*
  *  @dev Get only the admin list from full state contract
  */
  getAdminList(reload = false): Observable<string[]> {
    return this._arwikiToken.getState(reload).pipe(
      map((_state: any) => {
        this._adminList = Object.keys(_state.roles).filter((address) => {
          return _state.roles[address].toUpperCase() === 'MODERATOR';
        });

        return [...this._adminList];
      })
    );
  }

  /*
  *  @dev Get only the admin list from full state contract
  */
  isAdmin(address: string, reload=false): Observable<boolean> {
    return this.getAdminList(reload).pipe(
      map( (admin_list: string[]) => {
        return Array.prototype.indexOf.call(admin_list, address) >= 0; 
      })
    );
  }

  /*
  * @dev Create vote proposal for new Moderator
  */
  registerAdmin(
    _target: string,
    _privateKey: any,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      {name: 'Service', value: 'ArWiki'},
      {name: 'Arwiki-Type', value: 'ProposeModerator'},
      {name: 'Arwiki-Version', value: _arwikiVersion},
    ];
    const input = {
      function: 'propose',
      type: 'set',
      key: 'role',
      recipient: _target,
      value: 'Moderator',
      note: 'New Moderator'
    };
    return this._warp.writeInteraction(
      this._arwikiToken.contractAddress, jwk, input, tags
    );
  }

}
