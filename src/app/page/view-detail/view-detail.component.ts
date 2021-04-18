import { Component, OnInit } from '@angular/core';
import { ArweaveService } from '../../core/arweave.service';
import { ArwikiQuery } from '../../core/arwiki-query';

@Component({
  templateUrl: './view-detail.component.html',
  styleUrls: ['./view-detail.component.scss']
})
export class ViewDetailComponent implements OnInit {
	arwikiQuery: ArwikiQuery|null = null;

  constructor(private _arweave: ArweaveService) {

  }

  ngOnInit(): void {
  	this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
  	
  }

}
