import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {

  constructor(
  	private _location: Location
  ) { }

  ngOnInit(): void {
  }
	goBack() {
  	this._location.back();
  }


}
