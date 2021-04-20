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
    // Validate language from route parameters
    const langPath = this.getLangFromRoute(route, state);
    return this.isValidLanguage(langPath, route, state);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Validate language from route parameters
    const langPath = this.getLangFromRoute(route, state);
    return this.isValidLanguage(langPath, route, state);
  }

  /*
  *  Detect if language code is present in url
  *  and validate against language contract
  */
  isValidLanguage(
    lang: string, 
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> {
    // Init loader
    this._userSettings.updateMainToolbarLoading(true);

    // If language detected
    if (lang) {
      const langState = this._langIndexContract.getLangsLocalCopy();
      // Check if we already have a copy of language contract state
      if (Object.keys(langState).length > 0) {
        // Loader
        this._userSettings.updateMainToolbarLoading(false);
        // Show main toolbar 
        this._userSettings.updateMainToolbarVisiblity(true);
        // Scroll to top 
        this._userSettings.scrollToTop();

        // If success
        if (Object.prototype.hasOwnProperty.call(langState, lang)) {
          this._userSettings.updateRouteLangObservable(lang);
          return of(true);
        }
        // Else
        this.message('Language not supported', 'error');
        this._router.navigate(['/']);

        return of(false);
      }
      return (
        // If no copy detected, get the state from the contract
        this._langIndexContract.getState(this._arweave.arweave)
          .pipe(
            switchMap((state: any) => {
              // Save a copy of the state on local property
              this._langIndexContract.setLangsLocalCopy(state);

              // Loader
              this._userSettings.updateMainToolbarLoading(false);
              // Show main toolbar 
              this._userSettings.updateMainToolbarVisiblity(true);
              // Scroll to top 
              this._userSettings.scrollToTop();


              // If success
              if (Object.prototype.hasOwnProperty.call(state, lang)) {
                this._userSettings.updateRouteLangObservable(lang);
                return of(true);
              }
              // Else
              this.message('Language not supported', 'error');

              this._router.navigate(['/']);

              return of(false);
            })
          )
      );
    }

    // No lang detected in route
    this._userSettings.updateRouteLangObservable('');
    // Loader
    this._userSettings.updateMainToolbarLoading(false);
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
