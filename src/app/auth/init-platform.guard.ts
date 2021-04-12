import { Injectable } from '@angular/core';
import { 
	CanActivate, ActivatedRouteSnapshot, 
	CanActivateChild,
	RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { UserSettingsService } from '../core/user-settings.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ArwikiLangIndexContract } from '../arwiki-contracts/arwiki-lang-index';
import { ArweaveService } from '../core/arweave.service';

@Injectable({
  providedIn: 'root'
})
export class InitPlatformGuard implements CanActivate, CanActivateChild {
	constructor(
		private _userSettings: UserSettingsService,
    private _snackBar: MatSnackBar,
    private _router: Router,
    private _langIndexContract: ArwikiLangIndexContract,
    private _arweave: ArweaveService
	) {

	}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const langPath = this.getLangFromRoute(route, state);
    return this.isValidLanguage(langPath, route, state);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const langPath = this.getLangFromRoute(route, state);
    return this.isValidLanguage(langPath, route, state);
  }

  isValidLanguage(
    lang: string, 
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> {
    if (lang) {
      return (
        this._langIndexContract.getLangsLocalCopy()
          .pipe(
            switchMap((state: any) => {
              if (Object.prototype.hasOwnProperty.call(state, lang)) {
                this._userSettings.updatePath(state.url);
                this._userSettings.updatePathLang(lang);
                return of(true);
              }
              this.message('Language not supported', 'error');
              this._userSettings.updatePath('/');
              this._userSettings.updatePathLang('');
              this._router.navigate(['/']);

              return of(false);
            })
          )
      );
    }
    this._userSettings.updatePath(state.url);

    return of(true);
  }

  getLangFromRoute(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot) {
    let lang = '';
    if (route.params.lang) {
      lang = route.params.lang;
    }
    return lang;
  }


   /*
  *  Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
  }

  
}
