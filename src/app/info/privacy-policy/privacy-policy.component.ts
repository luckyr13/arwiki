import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss']
})
export class PrivacyPolicyComponent {
  loading = false;
  privacyPolicyUrl: SafeResourceUrl;
  
  constructor(
    private _location: Location,
    private _domSanitizer: DomSanitizer) {
    this.privacyPolicyUrl = _domSanitizer.bypassSecurityTrustResourceUrl('assets/policies/privacy-policy.html');

  }

  goBack() {
    this._location.back();
  }


}
