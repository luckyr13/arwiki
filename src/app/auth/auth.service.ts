import { Injectable } from '@angular/core';
import { ArweaveService } from './arweave.service';
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

  constructor(private _arweave: ArweaveService) {
    this.account = new Subject<string>();
    this.account$ = this.account.asObservable();

  }

  setAccount(account: string) {
    this.account.next(account);
  }



  login(walletOption: string, uploadInputEvent: any = null): Observable<any> {
  	let method = of({});

  	switch (walletOption) {
  		case 'upload_file':
        method = this._arweave.uploadKeyFile(uploadInputEvent).pipe(
            tap( (_account) => {
              this.setAccount(_account.toString());
            })
          );
  		break;

  		case 'waveid':
        return throwError('Not implemented yet :)');
  		break;

  		case 'arconnect':
  			method = this._arweave.getAccount().pipe(
            tap( (_account) => {

              this.setAccount(_account.toString());
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
    this.setAccount('');
    this._arweave.logout();
  }


}
