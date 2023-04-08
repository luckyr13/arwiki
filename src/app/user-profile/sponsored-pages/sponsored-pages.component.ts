import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { 
  ArwikiTokenContract 
} from '../../core/arwiki-contracts/arwiki-token.service';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { ArwikiPagesService } from '../../core/arwiki-contracts/arwiki-pages.service';
import { Subscription } from 'rxjs';

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
  pagesSubscription = Subscription.EMPTY;

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
    this.pagesSubscription = this._arwikiPages.getApprovedPages(
      this.routeLang,
      -1
    ).subscribe({
      next: (pages) => {
        const pagesAsArray: ArwikiPage[] = Object.values(pages);
        const pagesAsArray2 = pagesAsArray.filter((p) => p.sponsor === this.address);
        console.log(pagesAsArray2)
        pagesAsArray2.sort((a: ArwikiPage, b: ArwikiPage) => {
          return a.category.localeCompare(b.category) || a.slug.localeCompare(b.slug) ;
        });
        this.pages = pagesAsArray2;
      },
      error: (error) => {
        console.error('initTableAllPages', error);
      }
    })
    

  }

}
