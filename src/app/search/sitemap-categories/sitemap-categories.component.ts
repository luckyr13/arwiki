import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ArwikiCategory } from '../../core/interfaces/arwiki-category';
import { ArwikiCategoriesService } from '../../core/arwiki-contracts/arwiki-categories.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { UtilsService } from '../../core/utils.service';

@Component({
  selector: 'app-sitemap-categories',
  templateUrl: './sitemap-categories.component.html',
  styleUrls: ['./sitemap-categories.component.scss']
})
export class SitemapCategoriesComponent implements OnInit, OnDestroy {
  categories: ArwikiCategory[] = [];
  @Input('routeLang') routeLang = '';
  numPagesByCategory: Record<string, number> = {};
  categoriesSubscription = Subscription.EMPTY;

  constructor(
    private _arwikiCategories: ArwikiCategoriesService,
    private _route: ActivatedRoute,
    private _utils: UtilsService) { }

  ngOnInit() {
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;
    this._route.paramMap.subscribe(async params => {
      this.routeLang = params.get('lang')!;
    });

    this.initCategories();
  }

  initCategories() {
    const onlyActiveCategories = false;
    this.categoriesSubscription = this._arwikiCategories.getCategories(
      onlyActiveCategories
    ).subscribe({
      next: (categories) => {
        const categoriesAsArray: ArwikiCategory[] = Object.values(categories);
        categoriesAsArray.sort((a: ArwikiCategory, b: ArwikiCategory) => {
          return a.order - b.order;
        });
        this.categories = categoriesAsArray;
      },
      error: (error) => {
        this._utils.message(error, 'error');
      }
    });
    
  }
  totalPages() {
    const values = Object.values(this.numPagesByCategory);
    if (!values.length) {
      return 0;
    }
    return values.reduce((prev, current) => {
      return prev + current;
    })
  }

  ngOnDestroy() {
    this.categoriesSubscription.unsubscribe();
  }
}
