import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-moderators-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {

  constructor(
    private _location: Location
    ) { }

  ngOnInit(): void {
  }

  goBack() {
    this._location.back();
  }
}
