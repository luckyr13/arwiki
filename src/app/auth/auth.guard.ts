import { Injectable } from '@angular/core';
import { 
	CanActivate, ActivatedRouteSnapshot, 
	CanActivateChild,
	RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { UserSettingsService } from './user-settings.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
	constructor(
		private _userSettings: UserSettingsService
	) {

	}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    this._userSettings.updatePath(state.url);
    if (route.params.lang) {
      this._userSettings.updatePathLang(route.params.lang);
    }
    return true;
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    this._userSettings.updatePath(state.url);
    return true;
  }


  
}
