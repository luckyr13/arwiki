import { Injectable } from '@angular/core';
import { ArweaveService } from '../core/arweave.service';
import { Observable, EMPTY, of, throwError, Subject, from } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import Verto from "@verto/js";
import { UserInterface } from "@verto/js/dist/common/faces";

import { MatDialog } from '@angular/material/dialog';
import { 
  DialogConfirmComponent 
} from '../shared/dialog-confirm/dialog-confirm.component';


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
  // Login method 
  private _method: string = '';

  // Observable source
  private _userIsModeratorSource = new Subject<boolean>();
  // Observable stream
  public userIsModeratorStream = this._userIsModeratorSource.asObservable();
  public updateUserIsModerator(_isModerator: boolean) {
    this._userIsModeratorSource.next(_isModerator);
  }
  private _verto: Verto;


  getAdminList() {
    return this._adminList;
  }

  setAdminList(admins: string[]) {
    this._adminList = admins;
  }

  constructor(
    private _arweave: ArweaveService,
    private _dialog: MatDialog) {
    this.account = new Subject<string>();
    this.account$ = this.account.asObservable();
    this._verto = new Verto();
    this.loadAccount();
    
  }

  public get verto(): Verto {
    return this._verto;
  }

  public getProfile(address: string): Observable<UserInterface | undefined> {
    return from(this._verto.user.getUser(address));
  }

  loadAccount() {
    const mainAddress = window.sessionStorage.getItem('MAINADDRESS')
      || window.localStorage.getItem('MAINADDRESS');
    const arkey = window.sessionStorage.getItem('ARKEY')
      || window.localStorage.getItem('ARKEY');
    const method = window.sessionStorage.getItem('METHOD')
      || window.localStorage.getItem('METHOD');

    this._mainAddress = '';
    this._method = '';
    this._arKey = null;

    if (mainAddress) {
      if (method === 'webwallet') {
        this.resumeArweaveWalletSessionDialog(method!);
      } else {
        this._mainAddress = mainAddress
        this._method = method!;
        if (arkey) { this._arKey = JSON.parse(arkey) }
        this.account.next(mainAddress);
      }
    }
  }

  setAccount(mainAddress: string, arKey: any = null, stayLoggedIn: boolean = false, method='') {
    const storage = stayLoggedIn ? window.localStorage : window.sessionStorage;
    this._mainAddress = mainAddress;
    this._method = method;
    storage.setItem('MAINADDRESS', mainAddress);
    storage.setItem('METHOD', method);
    if (arKey) {
      this._arKey = arKey
      storage.setItem('ARKEY', JSON.stringify(this._arKey))
    }
    this.account.next(mainAddress);
    const isAdmin = this.getAdminList().indexOf(mainAddress) >= 0;
    if (isAdmin) {
      this.updateUserIsModerator(true);
    } else {
      this.updateUserIsModerator(false);
    }
  }

  removeAccount() {
    for (let key of ['MAINADDRESS', 'ARKEY', 'METHOD']) {
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
              this.setAccount(_res.address, _res.key, stayLoggedIn, walletOption)
            })
          );
      break;
      case 'arconnect':
        method = this._arweave.getAccount(walletOption).pipe(
            tap( (_account: any) => {
              this.removeAccount()
              this.setAccount(_account.toString(), null, stayLoggedIn, walletOption)
            })
          );
      break;
      case 'webwallet':
        method = this._arweave.getAccount(walletOption).pipe(
            tap( (_account: any) => {
              this.removeAccount()
              this.setAccount(_account.toString(), null, stayLoggedIn, walletOption)
            })
          );
      break;
      case 'finnie':
        method = this._arweave.getAccount(walletOption).pipe(
            tap( (_account: any) => {
              this.removeAccount()
              this.setAccount(_account.toString(), null, stayLoggedIn, walletOption)
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
    this.removeAccount();
    this.account.next('');
    this.updateUserIsModerator(false);
    if ((this._method === 'finnie' || 
        this._method === 'arconnect' || 
        this._method === 'webwallet') &&
        (window && window.arweaveWallet)) {
      window.arweaveWallet.disconnect();
    }
  }

  resumeArweaveWalletSessionDialog(method: string) {
    const dialogRef = this._dialog.open(DialogConfirmComponent, {
      data: {
        title: 'Session detected',
        content: 'Resume Arweave Web Wallet session?',
        type: 'confirm',
        confirmLabel: 'Alright! Resume session'
      },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this._arweave.arweaveWebWallet.connect().then((res: any) => {
          this._mainAddress = res;
          this._method = method!;
          this.account.next(res);
        }).catch((error: any) => {
          console.log('Error loading address');
        });
      }
    });
  }


}
