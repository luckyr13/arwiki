import { Component, OnInit } from '@angular/core';
import { arwikiVersion } from '../core/arwiki';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
	arwikiV: string = arwikiVersion[0];

  constructor() { }

  ngOnInit(): void {
  }

}
