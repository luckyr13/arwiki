import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-cookies-policy',
  templateUrl: './cookies-policy.component.html',
  styleUrls: ['./cookies-policy.component.scss']
})
export class CookiesPolicyComponent {
  loading = false;

  constructor(
    private _location: Location) {

  }

  goBack() {
    this._location.back();
  }
}
