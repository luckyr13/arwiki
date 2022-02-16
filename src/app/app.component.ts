import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef  } from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import { UserSettingsService } from './core/user-settings.service';
import { MatSidenavContainer } from '@angular/material/sidenav';
import {map} from 'rxjs/operators';

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
  mainToolbarLoading: boolean =  true;
  mainToolbarIsVisible: boolean = false;
  defaultTheme: string = '';
  appLogoLight: string = './assets/img/arweave-dark.png';
  appLogoDark: string = './assets/img/arweave-light.png';
  mainLogo: string = '';

  constructor(
    private _translate: TranslateService,
    private _userSettings: UserSettingsService,
    private _changeDetector: ChangeDetectorRef 
  ) {
    // this language will be used as a fallback when a translation isn't found in the current language
    // _translate.setDefaultLang('en');
    // the lang to use, if the lang isn't available, it will use the current loader to get them
    //_translate.use('en');

    const updateWritingDirectionAndLoading = (langObj: any) => {
      this.menuPosition = langObj.writing_system == 'RTL' ? 'end' : 'start'
    }
    updateWritingDirectionAndLoading(this._userSettings.getDefaultLang())
    this._userSettings.settingsLangStream.subscribe(updateWritingDirectionAndLoading)

    this.quoteNumber = this.getRandomInt(3);
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
    this.mainToolbarIsVisible = false;
    this.mainToolbarLoading = true;

    this.getDefaultTheme();
    this.mainLogo = this.getMainLogo();

    this._userSettings.mainToolbarLoadingStream.subscribe((res) => {
      this.mainToolbarLoading = res;
    });
    this._userSettings.mainToolbarVisibilityStream.subscribe((res) => {
      this.mainToolbarIsVisible = res;
    })



  }

  getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  consoleWelcomeMessage() {
    console.log('%cWelcome to the arwiki!', 'background: #000; color: #FFF; font-size: 32px; padding: 10px;');
    console.log('%cPlease let us know if you find some interesting bug 😄', 'font-weight: bold;');
    console.log('%cJoin us in our Discord Channel: https://discord.gg/mn8j66r4x3', '');
    console.log('%cFollow us on Twitter: https://twitter.com/TheArWiki', '');
  
  }

  getDefaultTheme() {
    this.defaultTheme = this._userSettings.getDefaultTheme();
    this._userSettings.defaultThemeStream.subscribe(
      (theme) => {
        this.defaultTheme = theme;
      }
    );
  }

  getMainLogo() {
    if (this.defaultTheme === 'arwiki-light' && this.appLogoLight) {
      return this.appLogoLight;
    } else if (this.defaultTheme === 'arwiki-dark' && this.appLogoDark) {
      return this.appLogoDark;
    }

    return '';
  }


    
}
