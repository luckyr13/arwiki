import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserSettingsService } from '../core/user-settings.service';
import { ArweaveService } from '../core/arweave.service';
import { Observable, Subscription } from 'rxjs';
import { ArwikiTokenContract } from '../core/arwiki-contracts/arwiki-token';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  defaultTheme: string = '';
  appName: string = '';
  appLogoLight: string = '';
  appLogoDark: string = '';
  appSettingsSubscription: Subscription = Subscription.EMPTY;
  loading: boolean = false;
  redirect: boolean = true;

  constructor(
    private _userSettings: UserSettingsService,
    private _arweave: ArweaveService,
    private _arwikiTokenContract: ArwikiTokenContract,
    private _snackBar: MatSnackBar,
    private _router: Router
  ) { }

  ngOnInit(): void {
    this.loading = true;
    if (this.redirect) {
      let defaultLang = this._userSettings.getDefaultLang();
      this._router.navigate([`/${defaultLang.code}`]);
      return;
    } else {
      this.defaultTheme = this._userSettings.getDefaultTheme();

      // Hide main toolbar 
      this._userSettings.updateMainToolbarVisiblity(false);

      this.appSettingsSubscription = this._arwikiTokenContract
        .getState()
        .subscribe({
          next: (state) => {
            const settings = new Map(state.settings);
            this.appName = `${settings.get('appName')}`;
            this.appLogoLight = `${this._arweave.baseURL}${settings.get('appLogo')}`;
            this.appLogoDark = `${this._arweave.baseURL}${settings.get('appLogoDark')}`;
            this.loading = false;
          },
          error: (error) => {
            this.message(error, 'error');
            this.loading = false;
          }
        });
    }
    

    
  }

  ngOnDestroy() {
    if (this.appSettingsSubscription) {
      this.appSettingsSubscription.unsubscribe();
    }
  }

  /*
  *  Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
  }


  getSkeletonLoaderAnimationType() {
    let type = 'progress';
    if (this.defaultTheme === 'arwiki-dark') {
      type = 'progress-dark';
    }
    return type;
  }

  getSkeletonLoaderThemeNgStyle() {
    let ngStyle: any = {
      'height.px': '80',
      'width.px': '80'
    };
    if (this.defaultTheme === 'arwiki-dark') {
      ngStyle['background-color'] = '#3d3d3d';
    }

    return ngStyle;
  }

  getSkeletonLoaderThemeNgStyle2() {
    let ngStyle: any = {
      'height.px': '42',
      'width.px': '200'
    };
    if (this.defaultTheme === 'arwiki-dark') {
      ngStyle['background-color'] = '#3d3d3d';
    }

    return ngStyle;
  }

  getSkeletonLoaderThemeNgStyle3() {
    let ngStyle: any = {
      'height.px': '32',
      'width.px': '240'
    };
    if (this.defaultTheme === 'arwiki-dark') {
      ngStyle['background-color'] = '#3d3d3d';
    }

    return ngStyle;
  }


}
