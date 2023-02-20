import { Component, OnInit } from '@angular/core';
import { arwikiVersion, arwikiAppVersion } from '../core/arwiki';
import { ActivatedRoute } from '@angular/router';
import { UserSettingsService } from '../core/user-settings.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
	arwikiProtocolV: string = arwikiVersion[0];
  arwikiV: string = arwikiAppVersion;
  routerLang = '';

  constructor(private _userSettings: UserSettingsService) { }

  ngOnInit(): void {

    let defaultLang = this._userSettings.getDefaultLang();
    if (defaultLang && defaultLang.code) {
      this.routerLang = defaultLang.code;
    }

    this._userSettings.routeLangStream.subscribe(async (data) => {
      if (data != this.routerLang) {
        this.routerLang = data; 
      }
      
    });
  }

}
