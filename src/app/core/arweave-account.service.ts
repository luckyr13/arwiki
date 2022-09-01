import { Injectable } from '@angular/core';
import Account from 'arweave-account'
import { ArAccount, ArProfile } from 'arweave-account';
import { from, Observable, map, of } from 'rxjs';
import { UserProfile } from './interfaces/user-profile';
import Transaction from 'arweave/web/lib/transaction';
import { JWKInterface } from 'arweave/web/lib/wallet';

/*
* Arweave Account
* https://github.com/MetaweaveTeam/arweave-account
*/

@Injectable({
  providedIn: 'root'
})
export class ArweaveAccountService {
  private readonly _account: Account;
  defaultProfileImage = 'assets/img/blank-profile.png';

  constructor() {
    const props = {
      cacheIsActivated: false,
      // cacheSize: 100,
      // cacheTime: 60000,
      gateway: {
        host: 'arweave.net', // Hostname or IP address for a Arweave host
        port: 443, // Port
        protocol: 'https', // Network protocol http or https
        timeout: 20000, // Network request timeouts in milliseconds
        logging: false,
      },
    };
    this._account = new Account(props);
  }

  // Get user profile by wallet address
  getProfile(walletAddr: string): Observable<UserProfile|null> {
    return from(this._account.get(walletAddr)).pipe(
      map((account: ArAccount) => {
        const profile = account && account.profile ? account.profile : null;
        const address = account && account.addr ? account.addr : '';
        const handleName = profile && profile.handleName ? profile.handleName : '';
        const username = account && account.handle && handleName ? account.handle : '';
        const name = profile && profile.name ? profile.name : '';
        const bio = profile && profile.bio ? profile.bio : '';
        const avatar = profile && profile.avatar ? profile.avatar : '';
        const banner = profile && profile.banner ? profile.banner : '';
        const bannerURL = profile && profile.bannerURL ? profile.bannerURL : '';
        const links = profile && profile.links ? profile.links : {};
        let avatarURL = profile && profile.avatarURL ? profile.avatarURL : '';
        if (avatarURL === 'https://arweave.net/OrG-ZG2WN3wdcwvpjz1ihPe4MI24QBJUpsJGIdL85wA') {
          avatarURL = this.defaultProfileImage;
        }
        const wallets = profile && profile.wallets ? profile.wallets : {};
        const email = profile && profile.email ? profile.email : '';

        let newProfile: UserProfile|null = null;
        if (username) {
          newProfile = {
            username,
            handleName,
            name,
            bio,
            address,
            avatar,
            banner,
            avatarURL,
            bannerURL,
            links,
            wallets,
            email
          };
        }
        return newProfile;
      })
    );
  }

  // Search user profile by handle name
  searchProfile(handle: string): Observable<UserProfile[]> {
    return from(this._account.search(handle)).pipe(
      map((accounts: ArAccount[]) => {
        const profiles: UserProfile[] = [];
        for (let account of accounts) {
          const profile = account && account.profile ? account.profile : null;
          const address = account && account.addr ? account.addr : '';
          const handleName = profile && profile.handleName ? profile.handleName : '';
          const username = account && account.handle && handleName ? account.handle : '';
          const name = profile && profile.name ? profile.name : '';
          const bio = profile && profile.bio ? profile.bio : '';
          const avatar = profile && profile.avatar ? profile.avatar : '';
          const banner = profile && profile.banner ? profile.banner : '';
          const bannerURL = profile && profile.bannerURL ? profile.bannerURL : '';
          const links = profile && profile.links ? profile.links : {};
          let avatarURL = profile && profile.avatarURL ? profile.avatarURL : '';
          if (avatarURL === 'https://arweave.net/OrG-ZG2WN3wdcwvpjz1ihPe4MI24QBJUpsJGIdL85wA') {
            avatarURL = this.defaultProfileImage;
          }
          const wallets = profile && profile.wallets ? profile.wallets : {};
          const email = profile && profile.email ? profile.email : '';
          
          let newProfile: UserProfile|null = null;
          if (username) {
            newProfile = {
              username,
              handleName,
              name,
              bio,
              address,
              avatar,
              banner,
              avatarURL,
              bannerURL,
              links,
              wallets,
              email
            };
            profiles.push(newProfile);
          }
          
        }
        return profiles;
      })
    );
  }

  // Find user profile by wallet address & handle name
  findProfile(handleUniqID: string): Observable<UserProfile|null> {
    return from(this._account.find(handleUniqID)).pipe(
      map((account: ArAccount|null) => {
        const profile = account && account.profile ? account.profile : null;
        const address = account && account.addr ? account.addr : '';
        const handleName = profile && profile.handleName ? profile.handleName : '';
        const username = account && account.handle && handleName ? account.handle : '';
        const name = profile && profile.name ? profile.name : '';
        const bio = profile && profile.bio ? profile.bio : '';
        const avatar = profile && profile.avatar ? profile.avatar : '';
        const banner = profile && profile.banner ? profile.banner : '';
        const bannerURL = profile && profile.bannerURL ? profile.bannerURL : '';
        const links = profile && profile.links ? profile.links : {};
        let avatarURL = profile && profile.avatarURL ? profile.avatarURL : '';
        if (avatarURL === 'https://arweave.net/OrG-ZG2WN3wdcwvpjz1ihPe4MI24QBJUpsJGIdL85wA') {
          avatarURL = this.defaultProfileImage;
        }
        const wallets = profile && profile.wallets ? profile.wallets : {};
        const email = profile && profile.email ? profile.email : '';

        let newProfile: UserProfile|null = null;
        if (username) {
          newProfile = {
            username,
            handleName,
            name,
            bio,
            address,
            avatar,
            banner,
            avatarURL,
            bannerURL,
            links,
            wallets,
            email
          };
        }
        return newProfile;
      })
    );
  }

  public updateProfile(
    profile: ArProfile,
    jwk?: JWKInterface|"use_wallet"|undefined): Observable<Transaction> {
    return from(this._updateProfileHelper(profile, jwk));
  }

  private async _updateProfileHelper(
    profile: ArProfile,
    jwk?: JWKInterface|"use_wallet"|undefined): Promise<Transaction> {
    await this._account.connect(jwk);
    const tx = await this._account.updateProfile(profile);
    return tx;
  }
}
