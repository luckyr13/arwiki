import { Injectable } from '@angular/core';
import { isVouched } from 'vouchdao';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VouchdaoService {

  constructor() { }

  public isVouched(address: string): Observable<boolean> {
    return from(isVouched(address));
  }
}
