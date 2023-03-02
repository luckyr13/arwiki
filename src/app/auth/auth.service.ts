import { Injectable } from '@angular/core';
import { ArweaveService } from '../core/arweave.service';
import { Observable, EMPTY, of, throwError, Subject, from } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { JWKInterface } from 'arweave/web/lib/wallet';
import { AddressKey } from './../core/interfaces/address-key';
// import * as b64 from 'base64-js';
// import { SubtleCryptoService } from './../core/subtle-crypto.service';
import { ProfileService } from './../core/profile.service';
import { UserProfile } from './../core/interfaces/user-profile';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private account: Subject<string>;
  // Observable string streams
  public account$: Observable<string>;
  // User's private key
  private _arKey: JWKInterface|'use_wallet'|undefined = undefined;
  // User's arweave public address
  private _mainAddress: string = '';
  // Save a temporal copy of the admin list
  private _adminList: string[] = [];
  // Login method 
  private _method: string = '';

  // Observable source
  private _userIsModeratorSource = new Subject<boolean>();
  // Observable stream
  public userIsModeratorStream = this._userIsModeratorSource.asObservable();
  public updateUserIsModerator(_isModerator: boolean) {
    this._userIsModeratorSource.next(_isModerator);
  }

  get loginMethod(): string {
    return this._method;
  }
  getAdminList() {
    return this._adminList;
  }

  setAdminList(admins: string[]) {
    this._adminList = admins;
  }

  constructor(
    private _arweave: ArweaveService,
    // private _crypto: SubtleCryptoService,
    private _profile: ProfileService) {
    this.account = new Subject<string>();
    this.account$ = this.account.asObservable();
    // this.loadAccount();
    // this._crypto.setSession(false, this.getStayLoggedIn());

    
  }

  public getProfile(address: string): Observable<UserProfile|null|undefined> {
    return from(this._profile.getProfileByAddress(address));
  }

  loadAccount(): Observable<boolean> {
    return new Observable((subscriber) => { 
        const stayLoggedIn = this.getStayLoggedIn();
        const storage = stayLoggedIn ? window.localStorage : window.sessionStorage;
        const method = storage.getItem('METHOD'); 
        const arkey = storage.getItem('ARKEY');

        this._mainAddress = '';
        this._method = '';
        this._arKey = undefined;

        if (method === 'arweavewebwallet') {
          // this.resumeArweaveWalletSessionDialog(method!);
          throw Error('LaunchArweaveWebWalletModal');
        } else if (method === 'arconnect' || method === 'finnie') {
          window.addEventListener('arweaveWalletLoaded', (e) => {
            this.login(method, null, stayLoggedIn).subscribe({
              next: (address) => {
                subscriber.next(!!address);
                subscriber.complete();
              },
              error: (error) => {
                subscriber.error(error);
              }
            });
          });
        } else if (method === 'upload_file' && arkey) {
          // Decrypt
          // Launch password modal
          // this.passwordDialog(arkey);
          throw Error('LaunchPasswordModal');
        } else {
          subscriber.next(false);
          subscriber.complete();
        }

      });
  }

  setAccount(
    mainAddress: string,
    arKey: JWKInterface|'use_wallet'|undefined = undefined,
    stayLoggedIn: boolean = false,
    method='',
    arKeyEncrypted: string = '') {
    const storage = stayLoggedIn ? window.localStorage : window.sessionStorage;
    this._mainAddress = mainAddress;
    this._method = method;
    storage.setItem('METHOD', method);
    storage.setItem('STAY_LOGGED_IN', stayLoggedIn ? '1' : '');
    if (arKey) {
      // ENCRYPT
      this._arKey = arKey
      storage.setItem('ARKEY', arKeyEncrypted)
    }
    this.account.next(mainAddress);
    const isAdmin = this.getAdminList().indexOf(mainAddress) >= 0;
    if (isAdmin) {
      this.updateUserIsModerator(true);
    } else {
      this.updateUserIsModerator(false);
    }
  }

  public addressChangeListener(mainAddress: string, stayLoggedIn: boolean, method: string) {
    if (method === 'arconnect') {
      if (!(window && window.arweaveWallet)) {
        throw Error('ArConnect not found');
      }
      window.addEventListener('walletSwitch', (e) => {
        if (this._mainAddress !== e.detail.address) {
          this.setAccount(e.detail.address, undefined, stayLoggedIn, method);
        }
      });

    } else if (method === 'arweavewebwallet') {
      if (!(window && window.arweaveWallet)) {
        throw Error('ArweaveWallet not found');
      }

      this._arweave.arweaveWebWallet.on('connect', (address) => {
        this.setAccount(address, undefined, stayLoggedIn, method);
      });
      this._arweave.arweaveWebWallet.on('disconnect', () => {
        this.removeAccount();
        this.account.next('');
        this.updateUserIsModerator(false);
        window.location.reload();
      });
    }
  }

  removeAccount() {
    this.account.next('');
    this._mainAddress = '';
    this._method = '';
    this._arKey = undefined;
    for (let key of ['MAINADDRESS', 'ARKEY', 'METHOD', 'STAY_LOGGED_IN', 'CRYPTO_CTR']) {
      window.sessionStorage.removeItem(key)
      window.localStorage.removeItem(key)
    }
  }


  public getMainAddressSnapshot(): string {
    return this._mainAddress;
  }

  getPrivateKey() {
    return this._arKey ? this._arKey : 'use_wallet'
  }

  login(
    walletOption: 'arconnect'|'arweavewebwallet'|'finnie'|'upload_file',
    uploadInputEvent: Event|null = null,
    stayLoggedIn: boolean = false): Observable<string> {
    let method: Observable<string>;

    switch (walletOption) {
      /*
      case 'upload_file':
        if (uploadInputEvent) {
          method = this._arweave.uploadKeyFile(uploadInputEvent).pipe(
            tap( (_res: AddressKey) => {
              this.removeAccount();
              // Encrypt the key first!
              // this.setAccount(_res.address, _res.key, stayLoggedIn, walletOption)
            })
          );
        } else {
          throw Error('InputError');
        }
      break;
      */
      case 'arconnect':
        method = this._arweave.getAccount(walletOption).pipe(
            tap( (_account: any) => {
              this.removeAccount()
              this.setAccount(_account.toString(), undefined, stayLoggedIn, walletOption)
              this.addressChangeListener(_account.toString(), stayLoggedIn, walletOption);
            })
          );
      break;
      case 'arweavewebwallet':
        method = this._arweave.getAccount(walletOption).pipe(
            tap( (_account: any) => {
              this.removeAccount()
              this.setAccount(_account.toString(), undefined, stayLoggedIn, walletOption)
              this.addressChangeListener(_account.toString(), stayLoggedIn, walletOption);
            })
          );
      break;
      case 'finnie':
        method = this._arweave.getAccount(walletOption).pipe(
            tap( (_account: any) => {
              this.removeAccount()
              this.setAccount(_account.toString(), undefined, stayLoggedIn, walletOption)
            })
          );
      break;
      default:
        return throwError('Wallet not supported');
      break;
    }

    return method;
  }

  async logout() {
    if ((this._method === 'finnie' || 
        this._method === 'arconnect') &&
        (window && window.arweaveWallet)) {
      try {
        await window.arweaveWallet.disconnect();
        console.log(this._method, 'Wallet disconnected');
      } catch (error) {
        console.error('wallet', error);
      }
    } else if (this._method === 'arweavewebwallet') {
      try {
        await this._arweave.arweaveWebWallet.disconnect();
        console.log(this._method, 'ArweaveWallet disconnected');
      } catch (error) {
        console.error('wallet', error);
      }
    }
    this.removeAccount();
    this.account.next('');
    this.updateUserIsModerator(false);

  }

  public destroySession() {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.location.reload();
  }

  public getSessionData() {
    return {
      localStorage: window.localStorage,
      sessionStorage: window.sessionStorage
    }
  }

  public getStayLoggedIn() {
    const stayLoggedIn = !!window.sessionStorage.getItem('STAY_LOGGED_IN')
        || !!window.localStorage.getItem('STAY_LOGGED_IN');
    return stayLoggedIn;
  }


}
