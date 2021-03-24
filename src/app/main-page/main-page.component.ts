import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent implements OnInit {
	articles: any[] = [
		{
			id: 1,
			title: 'Article 1',
			description: 'Description 1'
		},
		{
			id: 2,
			title: 'Article 2',
			description: 'Description 2'
		},
		{
			id: 3,
			title: 'Article 2',
			description: 'Description 3'
		}
	];

  constructor() { }

  ngOnInit(): void {
  }

}
