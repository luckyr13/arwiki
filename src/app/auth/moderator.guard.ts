import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { ArwikiTokenContract } from '../core/arwiki-contracts/arwiki-token.service';
import { ArweaveService } from '../core/arweave.service';
import { UtilsService } from '../core/utils.service';
import { UserSettingsService } from '../core/user-settings.service';
import { ArwikiAdminsService } from '../core/arwiki-contracts/arwiki-admins.service';

@Injectable({
  providedIn: 'root'
})
export class ModeratorGuard implements CanActivate, CanActivateChild {
	constructor(
    private _auth: AuthService,
    private _arweave: ArweaveService,
    private _arwikiTokenContract: ArwikiTokenContract,
    private _utils: UtilsService,
    private _userSettings: UserSettingsService,
    private _arwikiAdmins: ArwikiAdminsService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    return this.isUserModerator();
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    return this.isUserModerator();
  }
  
  isUserModerator() {
    const address = this._auth.getMainAddressSnapshot();
    this._userSettings.updateMainToolbarLoading(true);
    return (this._arwikiAdmins.getAdminList()
      .pipe(
        switchMap((_adminList: string[]) => {
          const isAdmin = _adminList.indexOf(address) >= 0;
          
          this._userSettings.updateMainToolbarLoading(false);
          if (isAdmin) {
            return of(true);
          }
          this._utils.message(`You are not a moderator!`, 'error');
          return of(false);
        }),
        catchError((error) => {
          this._utils.message(error, 'error');
          return of(false);
        }) 
      )
    );
  }
  
}
