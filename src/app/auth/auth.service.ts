import { Injectable } from '@angular/core';
import { ArweaveService } from '../core/arweave.service';
import { Observable, EMPTY, of, throwError, Subject} from 'rxjs';
import { tap } from 'rxjs/operators';
import { FormControl } from '@angular/forms';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private account: Subject<string>;
  // Observable string streams
  public account$: Observable<string>;
  // User's private key
  private _arKey: any = null;
  // User's arweave public address
  private _mainAddress: string = '';
  // Save a temporal copy of the admin list
  private _adminList: string[] = [];

  getAdminList() {
    return this._adminList;
  }

  setAdminList(admins: string[]) {
    this._adminList = admins;
  }

  constructor(private _arweave: ArweaveService) {
    this.account = new Subject<string>();
    this.account$ = this.account.asObservable();

    this.loadAccount();
    
  }

  loadAccount() {
    const mainAddress = window.sessionStorage.getItem('MAINADDRESS')
      || window.localStorage.getItem('MAINADDRESS')
    const arkey = window.sessionStorage.getItem('ARKEY')
      || window.localStorage.getItem('ARKEY')

    if (mainAddress) {
      this._mainAddress = mainAddress
      if (arkey) { this._arKey = JSON.parse(arkey) }
      this.account.next(mainAddress);
    }
  }

  setAccount(mainAddress: string, arKey: any = null, stayLoggedIn: boolean = false) {
    const storage = stayLoggedIn ? window.localStorage : window.sessionStorage
    this._mainAddress = mainAddress
    storage.setItem('MAINADDRESS', mainAddress);
    if (arKey) {
      this._arKey = arKey
      storage.setItem('ARKEY', JSON.stringify(this._arKey))
    }
    this.account.next(mainAddress);
  }

  removeAccount() {
    for (let key of ['MAINADDRESS', 'ARKEY']) {
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



  login(walletOption: string, uploadInputEvent: any = null, stayLoggedIn: boolean = false): Observable<any> {
    let method = of({});

    switch (walletOption) {
      case 'upload_file':
        method = this._arweave.uploadKeyFile(uploadInputEvent).pipe(
            tap( (_res: any) => {
              this.removeAccount()
              this.setAccount(_res.address, _res.key, stayLoggedIn)
            })
          );
      break;

      case 'waveid':
        return throwError('Not implemented yet :)');
      break;

      case 'arconnect':
        method = this._arweave.getAccount().pipe(
            tap( (_account: any) => {
              this.removeAccount()
              this.setAccount(_account.toString(), null, stayLoggedIn)
            })
          );
      break;

      default:
        return throwError('Wallet not supported');
      break;
    }

    return method;
  }

  logout() {
    this.removeAccount()
    this._arweave.logout();
    this.account.next('');
  }


}
