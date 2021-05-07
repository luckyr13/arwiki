import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { ArwikiSettingsContract } from '../arwiki-contracts/arwiki-settings';
import { ArweaveService } from '../core/arweave.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserSettingsService } from '../core/user-settings.service';
import { ArwikiAdminList } from '../core/interfaces/arwiki-admin-list';
declare const window: any;

@Injectable({
  providedIn: 'root'
})
export class ModeratorGuard implements CanActivate, CanActivateChild {
	constructor(
    private _auth: AuthService,
    private _arweave: ArweaveService,
    private _settingsContract: ArwikiSettingsContract,
    private _snackBar: MatSnackBar,
    private _userSettings: UserSettingsService
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
  	return (this._settingsContract.getAdminList()
      .pipe(
        switchMap((_adminList: ArwikiAdminList) => {
          const adminList = Object.keys(_adminList);
          const isAdmin = adminList.indexOf(address) >= 0;
          // Save a copy of the admin list 
          this._auth.setAdminList(adminList);

          this._userSettings.updateMainToolbarLoading(false);
          if (isAdmin) {
            return of(true);
          }
          this.message(`You are not a moderator!`, 'error');
          return of(false);
        }),
        catchError((error) => {
          this.message(error, 'error');
          return of(false);
        }) 
      )
    );
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
