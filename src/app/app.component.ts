import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef  } from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import { UserSettingsService } from './core/user-settings.service';
import { MatSidenavContainer } from '@angular/material/sidenav';
import { map, Subscription, switchMap, of } from 'rxjs';
import { AddressKey } from './core/interfaces/address-key';
/*
import { 
  PasswordDialogComponent 
} from './shared/password-dialog/password-dialog.component';
*/
import { ArweaveService } from './core/arweave.service';
// import { SubtleCryptoService } from './core/subtle-crypto.service';
import { JWKInterface } from 'arweave/web/lib/wallet';
// import * as b64 from 'base64-js';
import { AuthService } from './auth/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { 
  DialogConfirmComponent 
} from './shared/dialog-confirm/dialog-confirm.component';
import { UtilsService } from './core/utils.service';
declare const window: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy  {
	opened: boolean = false;
  quoteNumber: number = 0;
  @ViewChild(MatSidenavContainer) sidenavContainer!: MatSidenavContainer;
  mainToolbarLoading: boolean =  true;
  mainToolbarIsVisible: boolean = false;
  defaultTheme: string = '';
  appLogoLight: string = './assets/img/arweave-dark.png';
  appLogoDark: string = './assets/img/arweave-light.png';
  mainLogo: string = '';
  loginSubscription: Subscription = Subscription.EMPTY;
  loadAccountSubscription: Subscription = Subscription.EMPTY;
  getTranslationsSubscription = Subscription.EMPTY;

  constructor(
    private _translate: TranslateService,
    private _userSettings: UserSettingsService,
    private _changeDetector: ChangeDetectorRef,
    private _auth: AuthService,
    private _arweave: ArweaveService,
    private _dialog: MatDialog,
    private _utils: UtilsService
  ) {
    // this language will be used as a fallback when a translation isn't found in the current language
    // _translate.setDefaultLang('en');
    // the lang to use, if the lang isn't available, it will use the current loader to get them
    //_translate.use('en');
    this.quoteNumber = this.getRandomInt(3);
  }

  
  ngAfterViewInit() {
    this.sidenavContainer.scrollable.elementScrolled().subscribe((ev) => {
      const target: any = ev.target;
      const scroll: number = target.scrollTop;
      this._userSettings.updateScrollTop(scroll);
    });
    
  }

  ngOnInit() {
    this.loadAccountSubscription = this._auth.loadAccount().subscribe({
      next: (success) => {
        if (success) {
          this._utils.message(`Welcome back!`, 'success');
        }
      },
      error: (error) => {
        if (error == 'Error: LaunchArweaveWebWalletModal') {

          let dialogMsgG = '';
          let dialogTitleG = '';
          this.getTranslationsSubscription = this._translate.get(
            'RESUME_SESSION_DIALOG.MSG'
          ).pipe(
            switchMap((dialogMsg: string) => {
              dialogMsgG = dialogMsg;
              return this._translate.get('RESUME_SESSION_DIALOG.TITLE');
            }),
            switchMap((dialogTitle: string)=> {
              dialogTitleG = dialogTitle;
              return of('');
            })
          ).subscribe({
            next: () => {
              // Resume session dialog
              this.resumeSessionDialog(
                dialogMsgG,
                dialogTitleG);
            },
            error: (error) => {
              console.error('error loading translations')
            }
          })

          
        }
        // DEPRECATED
        // else if (error == 'Error: LaunchPasswordModal') {
          // Launch password modal
          // this.passwordDialog();
        // }
        else {
          this._utils.message(error, 'error');
        }
      }
    });
    this.consoleWelcomeMessage();
    this.mainToolbarIsVisible = false;
    this.mainToolbarLoading = true;

    this.getDefaultTheme();
    this.mainLogo = this.getMainLogo();

    this._userSettings.mainToolbarLoadingStream.subscribe((res) => {
      this.mainToolbarLoading = res;
    });
    this._userSettings.mainToolbarVisibilityStream.subscribe((res) => {
      this.mainToolbarIsVisible = res;
    })



  }

  getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  consoleWelcomeMessage() {
    console.log('%cWelcome to the arwiki!', 'background: #000; color: #FFF; font-size: 32px; padding: 10px;');
    console.log('%cPlease let us know if you find some interesting bug 😄', 'font-weight: bold;');
    console.log('%cJoin us in our Discord Channel: https://discord.gg/mn8j66r4x3', '');
    console.log('%cFollow us on Twitter: https://twitter.com/TheArWiki', '');
  
  }

  getDefaultTheme() {
    this.defaultTheme = this._userSettings.getDefaultTheme();
    this._userSettings.defaultThemeStream.subscribe(
      (theme) => {
        this.defaultTheme = theme;
      }
    );
  }

  getMainLogo() {
    if (this.defaultTheme === 'arwiki-light' && this.appLogoLight) {
      return this.appLogoLight;
    } else if (this.defaultTheme === 'arwiki-dark' && this.appLogoDark) {
      return this.appLogoDark;
    }

    return '';
  }

  ngOnDestroy() {
    this.loadAccountSubscription.unsubscribe();
    this.loadAccountSubscription.unsubscribe();
    this.loginSubscription.unsubscribe();
    this.getTranslationsSubscription.unsubscribe();
  }

  resumeSessionDialog(
    content: string,
    title: string
  ) {
    const dialogRef = this._dialog.open(DialogConfirmComponent, {
      data: {
        title: title,
        content: content
      },
      disableClose: true,
      width: '400px',
    });
    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        const stayLoggedIn = this._auth.getStayLoggedIn();
        // Throw Arweave Web Wallet dialog
        this.loginSubscription = this._auth.login(
          'arweavewebwallet',
          null,
          stayLoggedIn
        ).subscribe({
          next: (address: string|AddressKey) => {
            this._utils.message('Welcome!', 'success');
          },
          error: (error) => {
            this._utils.message(`Error: ${error}`, 'error');
          }
        });
      } else {
        await this._auth.logout();
      }
    });
  }

  /*
  // DEPRECATED
  passwordDialog() {
    const dialogRef = this._dialog.open(PasswordDialogComponent, {
      data: {
        title: 'Resume session',
        confirmLabel: 'Login',
        closeLabel: 'Cancel'
      },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(async (password) => {
      if (password) {
        const stayLoggedIn = this._auth.getStayLoggedIn();
        const storage = stayLoggedIn ? window.localStorage : window.sessionStorage;
        const arkey = storage.getItem('ARKEY')!;
        //const finalArKey = JSON.parse(this.b64_to_utf8(arkey));
        const ciphertext = b64.toByteArray(arkey);
        this._crypto.decrypt(password, ciphertext).subscribe({
          next: (p) => {
            let key: JWKInterface|undefined = undefined;
            try {
              key = JSON.parse(this._crypto.decodeTxtMessage(p.p));
              this._arweave.arweave.wallets.jwkToAddress(key).then((address) => {
                this._auth.setAccount(address, key, stayLoggedIn, 'upload_file', arkey);
              }).catch(async (reason) => {
                await this._auth.logout();
                this._utils.message('Error loading key', 'error');
              });
            } catch (error) {
              this.passwordDialog();
              console.error('ErrPwdDialog', error)
            }
            

          },
          error: (error) => {
            this._utils.message(error, 'error');
          }
        });
        
        
      } else {
        await this._auth.logout();
      }
    });
  }
  */

  


    
}
