import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import * as marked from 'marked';
import DOMPurify from 'dompurify';
import { Subscription } from 'rxjs';
import { ArweaveService } from '../../core/arweave.service';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';


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

  loadingData = false;
  articleDataSubscription = Subscription.EMPTY;
  articleData: string = '';

  readingTime: {minutes: number, seconds: number}|null = null;

  constructor(
    private _arweave: ArweaveService,
    private _arwikiTokenContract: ArwikiTokenContract) { }

  ngOnInit(): void {
    this.loadingData = true;
    this.articleDataSubscription = this._arweave.getDataAsStringObs(this.article.id).subscribe({
      next: (data) => {
        this.articleData = data;
        this.loadingData = false;
        // Calculate reading time
        const rawContent = this.removeHTMLfromStr(this.markdownToHTML(this.articleData));
        const tmpReadingTime = this._arwikiTokenContract.getReadingTime(rawContent);
        this.readingTime = this.minutesToMinSec(tmpReadingTime);
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

  sanitizeMarkdown(_s: string, _maxLength: number = 250) {
    _s = _s.replace(/[#*=\[\]]/gi, '')
    let res: string = `${_s.substring(0, _maxLength)} ...`;
    return res;
  }

  sanitizeImg(_img: string) {
    let res: string = _img.indexOf('http') >= 0 ?
      _img :
      _img ? `${this.baseURL}${_img}` : '';
    return res;
  }

  timestampToDate(_time: number) {
    let d = new Date(_time * 1000);
    return d;
  }

  /*
  *  @dev Sanitize HTML
  */
  markdownToHTML(_markdown: string) {
    var html = marked.parse(_markdown);
    var clean = DOMPurify.sanitize(html);
    return clean;
  }

  removeHTMLfromStr(_html: string) {
    return DOMPurify.sanitize(_html, {ALLOWED_TAGS: []});
  }

  minutesToMinSec(m: number): {minutes: number, seconds: number} {
    const minutes = Math.floor(m);
    const seconds = Math.round((m - minutes) * 60);

    return { minutes, seconds };
  }
}
