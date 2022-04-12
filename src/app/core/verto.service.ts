import { Injectable } from '@angular/core';
import Verto from '@verto/js';
import { Observable, from, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserInterface } from '@verto/js/dist/common/faces';

@Injectable({
  providedIn: 'root'
})
export class VertoService {
  private _verto: Verto;
  public profiles: Record<string, UserInterface> = {};

  constructor() {
    this._verto = new Verto();
  }

  public getProfile(address: string): Observable<UserInterface | undefined> {
    if (this.profiles[address]) {
      return of(this.profiles[address]);
    }
    return from(this._verto.user.getUser(address)).pipe(
      tap((profile) => {
        if (profile !== undefined) {
          this.profiles[address] = profile;
        }
      })
    );
  }
}
