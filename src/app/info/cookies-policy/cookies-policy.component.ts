import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-cookies-policy',
  templateUrl: './cookies-policy.component.html',
  styleUrls: ['./cookies-policy.component.scss']
})
export class CookiesPolicyComponent {
  loading = false;
  cookiesPolicyUrl: SafeResourceUrl;
  
  constructor(
    private _location: Location,
    private _domSanitizer: DomSanitizer) {
    this.cookiesPolicyUrl = _domSanitizer.bypassSecurityTrustResourceUrl('assets/policies/cookies-policy.html');

  }

  goBack() {
    this._location.back();
  }
}
