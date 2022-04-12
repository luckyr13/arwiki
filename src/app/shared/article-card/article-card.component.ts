import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import * as marked from 'marked';
import DOMPurify from 'dompurify';
import { Subscription } from 'rxjs';
import { ArweaveService } from '../../core/arweave.service';
import { MatSnackBar } from '@angular/material/snack-bar';


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

  constructor(
    private _arweave: ArweaveService,
    private _snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.loadingData = true;
    this.articleDataSubscription = this._arweave.getDataAsStringObs(this.article.id).subscribe({
      next: (data) => {
        this.articleData = data;
        this.loadingData = false;
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
    var html = marked(_markdown);
    var clean = DOMPurify.sanitize(html);
    return clean;
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
}
