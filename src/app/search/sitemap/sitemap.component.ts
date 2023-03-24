import { Component, OnDestroy, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service'; 
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-sitemap',
  templateUrl: './sitemap.component.html',
  styleUrls: ['./sitemap.component.scss']
})
export class SitemapComponent implements OnInit {
  routeLang = '';
  pagesSubscription = Subscription.EMPTY;
  loading = false;
  
  constructor(
    private _arwikiToken: ArwikiTokenContract,
    private _route: ActivatedRoute,
    private _location: Location) { }

  ngOnInit(): void {

    this.loading = true;

    this.routeLang = this._route.snapshot.paramMap.get('lang')!;
    this._route.paramMap.subscribe(async params => {
      this.routeLang = params.get('lang')!;
    });
    
  }

  
  goBack() {
    this._location.back();
  }
}
