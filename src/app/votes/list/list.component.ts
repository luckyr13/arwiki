import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent {
  loading = false;

  constructor(private _location: Location) {

  }

  goBack() {
    this._location.back();
  }

}
