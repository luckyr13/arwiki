import { Component, OnInit } from '@angular/core';
import { arwikiVersion, arwikiAppVersion } from '../core/arwiki';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
	arwikiProtocolV: string = arwikiVersion[0];
  arwikiV: string = arwikiAppVersion;

  constructor() { }

  ngOnInit(): void {
  }

}
