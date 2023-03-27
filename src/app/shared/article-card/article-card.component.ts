import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';

import { Subscription } from 'rxjs';
import { ArweaveService } from '../../core/arweave.service';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';
import { UtilsService } from '../../core/utils.service';


@Component({
  selector: 'app-article-card',
  templateUrl: './article-card.component.html',
  styleUrls: ['./article-card.component.scss']
})
export class ArticleCardComponent implements OnInit, OnDestroy {
  @Input() article!: ArwikiPage;
  @Input() routeLang: string = '';
  @Input() baseURL: string = '';
  @Input() defaultTheme: string = '';
  @Input() showSponsor = false;

  loadingData = false;
  articleDataSubscription = Subscription.EMPTY;
  articleData: string = '';

  readingTime: {minutes: number, seconds: number}|null = null;

  constructor(
    private _arweave: ArweaveService,
    private _arwikiTokenContract: ArwikiTokenContract,
    private _utils: UtilsService) { }

  ngOnInit(): void {
    this.loadingData = true;
    this.articleDataSubscription = this._arweave.getDataAsStringObs(this.article.id).subscribe({
      next: (data) => {
        this.articleData = data;
        this.loadingData = false;
        // Calculate reading time
        const rawContent = this._utils.removeHTMLfromStr(this.markdownToHTML(this.articleData));
        const tmpReadingTime = this._utils.getReadingTime(rawContent);
        this.readingTime = this._utils.minutesToMinSec(tmpReadingTime);
      },
      error: (error) => {
        console.error('Error loading data ', error);
        this.loadingData = false;
      }
    });
  }

  ngOnDestroy() {
    this.articleDataSubscription.unsubscribe();
  }

  timestampToDate(_time: number) {
    return this._utils.timestampToDate(_time);
  }

  markdownToHTML(_markdown: string) {
    return this._utils.markdownToHTML(_markdown);
  }


}
