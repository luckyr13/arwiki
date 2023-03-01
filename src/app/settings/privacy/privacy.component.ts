import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { arwikiVersion, arwikiAppVersion } from '../../core/arwiki';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss']
})
export class PrivacyComponent implements OnInit {
  loading = false;
  arwikiVersion = '';
  appVersion = '';
  localStorage: any = {}
  sessionStorage: any = {}

  constructor(
    private _location: Location,
    private _auth: AuthService) {

  }

  goBack() {
    this._location.back();
  }

  ngOnInit() {
    this.arwikiVersion = arwikiVersion[0];
    this.appVersion = arwikiAppVersion;

    const { localStorage, sessionStorage } = this._auth.getSessionData();

    this.localStorage = localStorage;
    this.sessionStorage = sessionStorage;
  }

  clearSession() {
    this._auth.destroySession();
    const { localStorage, sessionStorage } = this._auth.getSessionData();

    this.localStorage = localStorage;
    this.sessionStorage = sessionStorage;
  }
}
