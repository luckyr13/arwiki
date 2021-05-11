import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-my-pages',
  templateUrl: './my-pages.component.html',
  styleUrls: ['./my-pages.component.scss']
})
export class MyPagesComponent implements OnInit {
	loading: boolean = false;

  constructor(private _location: Location) { }

  ngOnInit(): void {
  }


	goBack() {
  	this._location.back();
  }
}
