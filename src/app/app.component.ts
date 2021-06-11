import { Component, OnInit, AfterViewInit, ViewChild  } from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import { UserSettingsService } from './core/user-settings.service';
import { MatSidenavContainer } from '@angular/material/sidenav';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit  {
	opened: boolean = false;
  menuPosition: any = 'start';
  quoteNumber: number = 0;
  @ViewChild(MatSidenavContainer) sidenavContainer!: MatSidenavContainer;
  mainToolbarLoading = this._userSettings.mainToolbarLoadingStream;
  mainToolbarIsVisible = this._userSettings.mainToolbarVisibilityStream;

  constructor(
    private _translate: TranslateService,
    private _userSettings: UserSettingsService
  ) {
    // this language will be used as a fallback when a translation isn't found in the current language
    // _translate.setDefaultLang('en');
    // the lang to use, if the lang isn't available, it will use the current loader to get them
    //_translate.use('en');

    const updateWritingDirection = (langObj: any) => {
      this.menuPosition = langObj.writing_system == 'RTL' ? 'end' : 'start'
    }
    updateWritingDirection(this._userSettings.getDefaultLang())
    this._userSettings.settingsLangStream.subscribe(updateWritingDirection)

    this.quoteNumber = this.getRandomInt(1);
  }

  
  ngAfterViewInit() {
    this.sidenavContainer.scrollable.elementScrolled().subscribe((ev) => {
      const target: any = ev.target;
      const scroll: number = target.scrollTop;
      this._userSettings.updateScrollTop(scroll);
    });
  }

  ngOnInit() {
    this.consoleWelcomeMessage();
  }

  getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  consoleWelcomeMessage() {
    console.log('%cWelcome to the arwiki!', 'background: #000; color: #FFF; font-size: 32px; padding: 10px;');
    console.log('%cPlease let us know if you find some interesting bug 😄', 'font-weight: bold;');
  }


    
}
