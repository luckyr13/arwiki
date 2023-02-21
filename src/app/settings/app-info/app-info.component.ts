import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-app-info',
  templateUrl: './app-info.component.html',
  styleUrls: ['./app-info.component.scss']
})
export class AppInfoComponent {
  loading = false;

  constructor(private _location: Location) {

  }

  goBack() {
    this._location.back();
  }
}
