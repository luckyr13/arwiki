import { Injectable } from '@angular/core';
import { ArdbWrapper } from './ardb-wrapper';
import { ArweaveService } from './arweave.service';
import { TransactionMetadata } from './interfaces/transaction-metadata';
import { Observable, map, from, of, tap } from 'rxjs';
import ArdbTransaction from 'ardb/lib/models/transaction';
import { UserProfile } from './interfaces/user-profile';
import { ArweaveAccountService } from './arweave-account.service';
import { ArProfile } from 'arweave-account';
import Transaction from 'arweave/web/lib/transaction';
import { JWKInterface } from 'arweave/web/lib/wallet';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private _ardb: ArdbWrapper;
  public profiles: Record<string, UserProfile> = {};

  constructor(
    private _arweave: ArweaveService,
    private _account: ArweaveAccountService) {
    this._ardb = new ArdbWrapper(this._arweave.arweave);
  }
  
  public getProfileByAddress(address: string): Observable<UserProfile|null|undefined> {    
    if (this.profiles[address]) {
      return of(this.profiles[address]);
    }
    return from(this._account.getProfile(address)).pipe(
      tap((profile) => {
        if (profile) {
          this.profiles[address] = profile;
        }
      })
    );
  }

  public getProfileByHandle(handle: string): Observable<UserProfile[]|null|undefined> {    
    return from(this._account.searchProfile(handle)).pipe(
      tap((profiles) => {
        for (const p of profiles) {
          if (p && p.address) {
            this.profiles[p.address] = p;
          }
        }
      })
    );
  }

  public getProfileByHandleUniqueID(handleUniqID: string): Observable<UserProfile|null|undefined> {    
    return from(this._account.findProfile(handleUniqID)).pipe(
      tap((profile) => {
        if (profile && profile.address) {
          this.profiles[profile.address] = profile;
        }
      })
    );
  }

  public updateProfile(
    profile: ArProfile,
    jwk?: JWKInterface|"use_wallet"|undefined): Observable<Transaction> {
    return this._account.updateProfile(profile, jwk);
  }
}