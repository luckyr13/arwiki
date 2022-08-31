import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Subscription, EMPTY } from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { 
  PasswordDialogComponent 
} from '../../shared/password-dialog/password-dialog.component';
import { SubtleCryptoService } from '../../core/subtle-crypto.service';
import * as b64 from 'base64-js';
import { UserSettingsService } from '../../core/user-settings.service';
import { Direction } from '@angular/cdk/bidi';
import { JWKInterface } from 'arweave/web/lib/wallet';
import { AddressKey } from '../../core/interfaces/address-key';

@Component({
  selector: 'app-bottom-sheet-login',
  templateUrl: './bottom-sheet-login.component.html',
  styleUrls: ['./bottom-sheet-login.component.scss']
})
export class BottomSheetLoginComponent implements OnInit, OnDestroy {
  login$: Subscription = Subscription.EMPTY;
  loading: boolean = false;
  stayLoggedIn: boolean = false;
  encryptSubscription = Subscription.EMPTY;

  constructor(
    private _auth: AuthService,
    private _snackBar: MatSnackBar,
    private _bottomSheetRef: MatBottomSheetRef<BottomSheetLoginComponent>,
    private _router: Router,
    private _dialog: MatDialog,
    private _crypto: SubtleCryptoService, 
    private _userSettings: UserSettingsService
  ) {}

  ngOnInit(): void {
    // this.loading = true;

    // this.loading = false;
    
  }

  /*
  *  @dev Destroy subscriptions
  */
  ngOnDestroy(): void {
    this.login$.unsubscribe();
    this.encryptSubscription.unsubscribe();
  }

  /*
  *  @dev Listen for click on HTML element
  */
  uploadFileListener(fileUploader: any) {
    fileUploader.click();
  }

  setStayLoggedIn(event: any) {
    this.stayLoggedIn = event.checked
  }

  /*
  *  @dev Select a method to connect wallet from modal (or bottom sheet)
  */
  login(
    walletOption: 'arconnect'|'arweavewebwallet'|'finnie'|'upload_file',
    fileInputEvent?: Event) {
    this.loading = true;

    if (walletOption === 'arweavewebwallet') {
      this.loading = false;
    }

    this.login$ = this._auth.login(walletOption, fileInputEvent, this.stayLoggedIn).subscribe({
      next: (res: any) => {
        // If pk
        if (walletOption === 'upload_file') {
          const tmpAddress = res as AddressKey;
          const target = <HTMLInputElement>(fileInputEvent!.target!);
          target.value = '';
          this.setPasswordDialog(tmpAddress);
            
        } else {
          this._bottomSheetRef.dismiss();
          this.loading = false;
          this.message('Welcome!', 'success');
        }
      },
      error: (error) => {
        this.message(`Error: ${error}`, 'error');
        this.loading = false;
        this._bottomSheetRef.dismiss();

      }
    });
  }


  /*
  *  Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 8000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
  }

  setPasswordDialog(tmpAddress: AddressKey) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang && defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(PasswordDialogComponent, {
      data: {
        title: 'Set password',
        confirmLabel: 'Set password',
        closeLabel: 'Cancel'
      },
      disableClose: true,
      direction: direction
    });
    dialogRef.afterClosed().subscribe(password => {
      if (password) {
        // Save user data
        const data = JSON.stringify(tmpAddress.key);
        this._crypto.newSession(this.stayLoggedIn);
        this.encryptSubscription = this._crypto.encrypt(password, data).subscribe({
          next: (c) => {
            const encodedKey = b64.fromByteArray(new Uint8Array(c.c));
            const key: JWKInterface = JSON.parse(JSON.stringify(tmpAddress.key));
            this._auth.setAccount(
              tmpAddress.address,
              key,
              this.stayLoggedIn,
              'upload_file',
              encodedKey);
            this.loading = false;
            this._bottomSheetRef.dismiss(tmpAddress.address);
            this.message('Welcome!', 'success');
          },
          error: (error) => {
            this.message(error, 'error');
            this.loading = false;
          }
        });
        
      } else {
        this._auth.logout();
        this.message('Bye, bye!', 'error');
        this.loading = false;
      }
    });
  }

}
