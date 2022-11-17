import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-badges',
  templateUrl: './badges.component.html',
  styleUrls: ['./badges.component.scss']
})
export class BadgesComponent implements OnInit {
  @Input('address') address: string = '';
  @Input('lang') routeLang: string = '';

  constructor() { }

  ngOnInit(): void {
  }

}
