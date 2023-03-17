import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { 
  ArwikiTokenContract 
} from '../../core/arwiki-contracts/arwiki-token.service';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { ArwikiPagesService } from '../../core/arwiki-contracts/arwiki-pages.service';

@Component({
  selector: 'app-sponsored-pages',
  templateUrl: './sponsored-pages.component.html',
  styleUrls: ['./sponsored-pages.component.scss']
})
export class SponsoredPagesComponent implements OnInit, OnChanges {
  @Input('address') address: string = '';
  @Input('lang') routeLang: string = '';
  loading: boolean = false;
  pages: ArwikiPage[] = [];
  displayedColumns: string[] = ['slug', 'category', 'value'];

  constructor(
    private _arwikiToken: ArwikiTokenContract,
    private _arwikiPages: ArwikiPagesService) { }

  ngOnInit(): void {
    this.initTableAllPages();
  }

  ngOnChanges() {
    this.initTableAllPages();
  }

  initTableAllPages() {
    const pages = this._arwikiPages.getAllPagesFromLocalState(this.routeLang);
    const pagesAsArray: ArwikiPage[] = Object.values(pages);
    const pagesAsArray2 = pagesAsArray.filter((p) => p.sponsor === this.address);
    pagesAsArray2.sort((a: ArwikiPage, b: ArwikiPage) => {
      return a.category.localeCompare(b.category) || a.slug.localeCompare(b.slug) ;
    });
    this.pages = pagesAsArray2;

  }

}
