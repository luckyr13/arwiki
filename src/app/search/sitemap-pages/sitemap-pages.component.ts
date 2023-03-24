import { 
  Component, ViewChild, OnInit,
  AfterViewInit, OnDestroy, Input } from '@angular/core';
import {MatTable, MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { ArwikiPagesService } from '../../core/arwiki-contracts/arwiki-pages.service';
import { Subscription } from 'rxjs';
import { UtilsService } from '../../core/utils.service';

@Component({
  selector: 'app-sitemap-pages',
  templateUrl: './sitemap-pages.component.html',
  styleUrls: ['./sitemap-pages.component.scss']
})
export class SitemapPagesComponent implements OnInit, AfterViewInit, OnDestroy {
  dataSource!: MatTableDataSource<ArwikiPage>;
  @ViewChild('sortPages') sort!: MatSort;
  displayedColumns: string[] = ['slug', 'category', 'sponsor', 'value', 'active'];
  @ViewChild(MatTable) table!: MatTable<ArwikiPage>;
  @ViewChild('pagesPaginator') paginator!: MatPaginator;
  @Input('routeLang') routeLang = '';
  pagesSubscription = Subscription.EMPTY;

  constructor(
    private _arwikiPages: ArwikiPagesService,
    private _utils: UtilsService) { }

  initTableAllPages() {
    this.dataSource = new MatTableDataSource<ArwikiPage>([]);

    const pages = this._arwikiPages.getAllPages(
      this.routeLang
    ).subscribe({
      next: (pages) => {
        const pagesAsArray: ArwikiPage[] = Object.values(pages);
        pagesAsArray.sort((a: ArwikiPage, b: ArwikiPage) => {
          return a.category.localeCompare(b.category) || a.slug.localeCompare(b.slug) ;
        });
        this.dataSource.data = pagesAsArray;

      },
      error: (error) => {
        this._utils.message(error, 'error');
      }
    });
    
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  ngOnInit() {
    this.initTableAllPages();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

  }

  ngOnDestroy() {
    this.pagesSubscription.unsubscribe();
  }

}
