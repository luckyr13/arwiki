import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-languages',
  templateUrl: './languages.component.html',
  styleUrls: ['./languages.component.scss']
})
export class LanguagesComponent {
  loading = false;

  constructor(private _location: Location) {

  }

  goBack() {
    this._location.back();
  }

}
