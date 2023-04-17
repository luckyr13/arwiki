import { Component } from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UserSettingsService } from '../../core/user-settings.service';

@Component({
  selector: 'app-dialog-cookies-msg',
  templateUrl: './dialog-cookies-msg.component.html',
  styleUrls: ['./dialog-cookies-msg.component.scss']
})
export class DialogCookiesMsgComponent {
  constructor(
    public dialogRef: MatDialogRef<DialogCookiesMsgComponent>,
    private _userSettings: UserSettingsService,
    private _router: Router) {

  }

  acceptCookies() {
    this._userSettings.setCookiesAccepted(true);
    this.dialogRef.close('accept');
  }

  learnMore() {
    let langCode = 'en';
    const defLang = this._userSettings.getDefaultLang();
    if (defLang && defLang.code) {
      langCode = defLang.code.toLowerCase();
    }
    this._router.navigate(['/', langCode, 'cookie-policy']);

  }
}
