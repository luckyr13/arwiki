import { Component, OnDestroy, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service'; 
import { Subscription } from 'rxjs';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import {MatSort} from '@angular/material/sort';
import { MatTable} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import { ArwikiCategory } from '../../core/interfaces/arwiki-category';

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
  displayedColumns: string[] = ['slug', 'category', 'sponsor', 'start', 'active'];
  dataSource!: MatTableDataSource<ArwikiPage>;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatTable) table!: MatTable<ArwikiPage>;
  numPagesByCategory: Record<string, number> = {};

  constructor(
    private _arwikiToken: ArwikiTokenContract,
    private _route: ActivatedRoute,
    private _snackBar: MatSnackBar,
    private _liveAnnouncer: LiveAnnouncer) { }

  ngOnInit(): void {

    this.loading = true;

    this.routeLang = this._route.snapshot.paramMap.get('lang')!;
    this._route.paramMap.subscribe(async params => {
      this.routeLang = params.get('lang')!;
    });
    
    this.initTableAllPages();
    this.initCategories();
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

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy() {

  }

  /*
  *  Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 8000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
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
}
