import { Component, OnDestroy, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service'; 
import { Subscription } from 'rxjs';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { ActivatedRoute } from '@angular/router';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import {MatSort} from '@angular/material/sort';
import {MatTable, MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import { ArwikiCategory } from '../../core/interfaces/arwiki-category';
import { ArwikiLang } from '../../core/interfaces/arwiki-lang';
import { Location } from '@angular/common';
import { ArwikiLangsService } from '../../core/arwiki-contracts/arwiki-langs.service';

@Component({
  selector: 'app-sitemap',
  templateUrl: './sitemap.component.html',
  styleUrls: ['./sitemap.component.scss']
})
export class SitemapComponent implements OnInit, AfterViewInit, OnDestroy {
  categories: ArwikiCategory[] = [];
  routeLang = '';
  pagesSubscription = Subscription.EMPTY;
  loading = false;
  displayedColumns: string[] = ['slug', 'category', 'sponsor', 'start', 'value', 'active'];
  dataSource!: MatTableDataSource<ArwikiPage>;
  @ViewChild('sortPages') sort!: MatSort;
  @ViewChild('sortLangs') sortLangs!: MatSort;
  @ViewChild('pagesPaginator') paginator!: MatPaginator;
  @ViewChild('langsPaginator') langsPaginator!: MatPaginator;
  @ViewChild(MatTable) table!: MatTable<ArwikiPage>;
  numPagesByCategory: Record<string, number> = {};
  dataSourceLangs!: MatTableDataSource<ArwikiLang>;
  displayedColumnsLangs: string[] = ['code', 'iso_name', 'native_name', 'writing_system', 'total', 'active'];
  numLangsByCode: Record<string, number> = {};

  constructor(
    private _arwikiToken: ArwikiTokenContract,
    private _route: ActivatedRoute,
    private _liveAnnouncer: LiveAnnouncer,
    private _location: Location,
    private _arwikiTokenLangs: ArwikiLangsService) { }

  ngOnInit(): void {

    this.loading = true;

    this.routeLang = this._route.snapshot.paramMap.get('lang')!;
    this._route.paramMap.subscribe(async params => {
      this.routeLang = params.get('lang')!;
    });
    
    this.initTableAllPages();
    this.initCategories();
    this.initLanguages();
  }

  initTableAllPages() {
    const pages = this._arwikiToken.getAllPagesFromLocalState(this.routeLang);
    const pagesAsArray: ArwikiPage[] = Object.values(pages);
    pagesAsArray.sort((a: ArwikiPage, b: ArwikiPage) => {
      return a.category.localeCompare(b.category) || a.slug.localeCompare(b.slug) ;
    });
    this.dataSource = new MatTableDataSource<ArwikiPage>(pagesAsArray);

    pagesAsArray.forEach((page: ArwikiPage) => {
      if (Object.prototype.hasOwnProperty.call(this.numPagesByCategory, page.category)) {
        this.numPagesByCategory[page.category]++;
      } else {
        this.numPagesByCategory[page.category] = 1;
      }
    });
  }

  initCategories() {
    const categories = this._arwikiToken.getCategoriesFromLocal();
    const categoriesAsArray: ArwikiCategory[] = Object.values(categories);
    categoriesAsArray.sort((a: ArwikiCategory, b: ArwikiCategory) => {
      return a.order - b.order;
    });
    this.categories = categoriesAsArray;
  }

  initLanguages() {
    const langs = this._arwikiTokenLangs.getLanguagesFromLocal();
    const langsAsArray: ArwikiLang[] = Object.values(langs);

    langsAsArray.sort((a: ArwikiLang, b: ArwikiLang) => {
      return a.code.localeCompare(b.code);
    });
    this.dataSourceLangs = new MatTableDataSource<ArwikiLang>(langsAsArray);

    langsAsArray.forEach((lang: ArwikiLang) => {
      const pages = this._arwikiToken.getAllPagesFromLocalState(lang.code);
      const numPages = Object.keys(pages).length;
      this.numLangsByCode[lang.code] = numPages ? numPages : 0;
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSourceLangs.paginator = this.langsPaginator;
    this.dataSourceLangs.sort = this.sortLangs

  }

  ngOnDestroy() {

  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  totalPages() {
    return Object.values(this.numPagesByCategory).reduce((prev, current) => {
      return prev + current;
    })
  }
  
  timestampToDate(_time: number) {
    let d = new Date(_time * 1000);
    return d;
  }

  applyFilterLang(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceLangs.filter = filterValue.trim().toLowerCase();

    if (this.dataSourceLangs.paginator) {
      this.dataSourceLangs.paginator.firstPage();
    }
  }
  
  goBack() {
    this._location.back();
  }
}
