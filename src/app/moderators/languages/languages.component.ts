import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { ArwikiLang } from '../../core/interfaces/arwiki-lang';
import { ArwikiTokenLangsService } from '../../core/arwiki-contracts/arwiki-langs.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-languages',
  templateUrl: './languages.component.html',
  styleUrls: ['./languages.component.scss']
})
export class LanguagesComponent implements OnInit, OnDestroy {
  loading = false;
  langs: Record<string, ArwikiLang> = {};
  langsSubscription = Subscription.EMPTY;
  langCodes: string[] = [];

  constructor(
    private _location: Location,
    private _tokenContractLangs: ArwikiTokenLangsService) {

  }

  goBack() {
    this._location.back();
  }

  ngOnInit() {
    this.langsSubscription = this._tokenContractLangs.getLangs()
      .subscribe({
        next: (langs) => {
          this.langs = langs;
          this.langCodes = Object.keys(this.langs);
        },
        error: (error) => {

        }
      });

  }

  ngOnDestroy() {
    this.langsSubscription.unsubscribe();
  }



}
