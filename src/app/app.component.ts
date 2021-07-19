import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef  } from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import { UserSettingsService } from './core/user-settings.service';
import { MatSidenavContainer } from '@angular/material/sidenav';
import gsap from 'gsap';
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
  @ViewChild('mainLoadingContainer1') mainLoadingContainer1!: ElementRef;
  mainToolbarLoading: boolean =  true;
  mainToolbarIsVisible: boolean = false;
  defaultTheme: string = '';
  appLogoLight: string = './assets/img/arweave-dark.png';
  appLogoDark: string = './assets/img/arweave-light.png';
  mainLogo: string = '';
  @ViewChild('mainLogoImg') mainLogoImg!: ElementRef;
  loadingLabel = this._translate.get('LOADING.LOADING_LABEL')
    .pipe(map((res) => {
      return Array.from(res);
    }));

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
    window.setTimeout(() => {
      this.animateLoadingContainer(this.mainLoadingContainer1);
      this.animateFlipLogo(this.mainLogoImg);
    }, 200);

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
  }

  animateLoadingContainer(_container: ElementRef) {
    gsap.to(`#${_container.nativeElement.id} span`, {
      opacity: 1, duration: 0.5, stagger: 0.1, repeat: -1, yoyo: true
    });
  }

  animateFlipLogo(_logo: ElementRef) {
    gsap.to(_logo.nativeElement, {rotationY: 360, repeat: -1, duration: 2});
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
