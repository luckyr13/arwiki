import {
  Component, ViewChild, OnInit,
  AfterViewInit, OnDestroy, Input } from '@angular/core';
import {MatTable, MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import { ArwikiLang } from '../../core/interfaces/arwiki-lang';
import { ArwikiLangsService } from '../../core/arwiki-contracts/arwiki-langs.service';
import { ArwikiPagesService } from '../../core/arwiki-contracts/arwiki-pages.service';
import { Subscription, switchMap } from 'rxjs';
import { UtilsService } from '../../core/utils.service';

@Component({
  selector: 'app-sitemap-langs',
  templateUrl: './sitemap-langs.component.html',
  styleUrls: ['./sitemap-langs.component.scss']
})
export class SitemapLangsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sortLangs') sortLangs!: MatSort;
  @ViewChild('langsPaginator') langsPaginator!: MatPaginator; 
  dataSourceLangs!: MatTableDataSource<ArwikiLang>;
  displayedColumnsLangs: string[] = ['code', 'iso_name', 'native_name', 'writing_system', 'total', 'active'];
  numLangsByCode: Record<string, number> = {};
  langsSubscription = Subscription.EMPTY;

  constructor(
    private _arwikiLangs: ArwikiLangsService,
    private _arwikiPages: ArwikiPagesService,
    private _utils: UtilsService) { }

  ngOnInit() {
    this.initLanguages();
  }

  initLanguages() {
    this.dataSourceLangs = new MatTableDataSource<ArwikiLang>([]);
    const onlyActiveLangs = false;
    const reload = false;
    const langsAsArray: ArwikiLang[] = [];

    this.langsSubscription = this._arwikiLangs.getLanguages(
      onlyActiveLangs,
      reload
    ).pipe(
      switchMap((langs) => {
        langsAsArray.push(...Object.values(langs));
        langsAsArray.sort((a: ArwikiLang, b: ArwikiLang) => {
          return a.code.localeCompare(b.code);
        });
        const onlyActivePages = true;
        return this._arwikiPages.getAllPagesByLangCode(onlyActivePages);
      })
    ).subscribe({
      next: (pages) => {
        this.dataSourceLangs.data = langsAsArray;

        langsAsArray.forEach((lang: ArwikiLang) => {
          const numPages = Object.keys(pages[lang.code]).length;
          this.numLangsByCode[lang.code] = numPages ? numPages : 0;
        });
      },
      error: (error) => {
        this._utils.message(error, 'error');
      }
    });

    
  }

  applyFilterLang(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceLangs.filter = filterValue.trim().toLowerCase();

    if (this.dataSourceLangs.paginator) {
      this.dataSourceLangs.paginator.firstPage();
    }
  }

  ngAfterViewInit() {
    this.dataSourceLangs.paginator = this.langsPaginator;
    this.dataSourceLangs.sort = this.sortLangs

  }

  ngOnDestroy() {
    this.langsSubscription.unsubscribe();
  }
}
