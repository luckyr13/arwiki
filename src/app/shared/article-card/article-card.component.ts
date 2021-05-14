import { Component, Input, OnInit } from '@angular/core';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import * as marked from 'marked';
import DOMPurify from 'dompurify';


@Component({
  selector: 'app-article-card',
  templateUrl: './article-card.component.html',
  styleUrls: ['./article-card.component.scss']
})
export class ArticleCardComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  @Input() article!: ArwikiPage;
  @Input() articleData: string = '';
  @Input() routeLang: string = '';
  @Input() baseURL: string = '';
  @Input() defaultTheme: string = '';

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
    return html;
  }
}
