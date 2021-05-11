import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-my-pages',
  templateUrl: './my-pages.component.html',
  styleUrls: ['./my-pages.component.scss']
})
export class MyPagesComponent implements OnInit {
	loading: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

}
