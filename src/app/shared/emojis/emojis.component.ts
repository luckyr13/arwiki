import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-emojis',
  templateUrl: './emojis.component.html',
  styleUrls: ['./emojis.component.scss']
})
export class EmojisComponent implements OnInit {
	emojis: string[] = [
		'😀', '😃'
	];
	
  constructor() { }

  ngOnInit(): void {
  }

}
