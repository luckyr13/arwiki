import { Injectable } from '@angular/core';
import { isVouched } from 'vouchdao';
import { Observable, from, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VouchDaoService {
  vouchedAccounts: Record<string, boolean> = {};

  constructor() { }

  public isVouched(address: string): Observable<boolean> {
    if (address in this.vouchedAccounts) {
      return of(this.vouchedAccounts[address]);
    }
    return from(isVouched(address)).pipe(
      tap((vouched) => {
        this.vouchedAccounts[address] = vouched;
      })
    );
  }
}
