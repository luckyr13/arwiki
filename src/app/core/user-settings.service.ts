import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {TranslateService} from '@ngx-translate/core';
declare const window: any;
declare const document: any;

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {
	_defaultTheme: string = '';
	_defaultLang: any = '';

  // Observable string sources
  private _settingsLangSource = new Subject<any>();

  // Observable string streams
  public settingsLangStream = this._settingsLangSource.asObservable();

  public updateSettingsLangObservable(_lang: any) {
    this._settingsLangSource.next(_lang);
  }

  // Observable string sources
  private _defaultThemeSource = new Subject<string>();

  // Observable string streams
  public defaultThemeStream = this._defaultThemeSource.asObservable();

  public updateDefaultThemeObservable(_path: string) {
    this._defaultThemeSource.next(_path);
  }

  // Observable string sources
  private _mainToolbarLoadingSource = new Subject<boolean>();

  // Observable string streams
  public mainToolbarLoadingStream = this._mainToolbarLoadingSource.asObservable();

  updateMainToolbarLoading(_loading: boolean) {
    this._mainToolbarLoadingSource.next(_loading);
  }

  // Observable string sources
  private _routeLangSource = new Subject<any>();

  // Observable string streams
  public routeLangStream = this._routeLangSource.asObservable();

  public updateRouteLangObservable(_lang: any) {
    this._routeLangSource.next(_lang);
  }

  // Observable string sources
  private _mainToolbarVisibilitySource = new Subject<any>();

  // Observable string streams
  public mainToolbarVisibilityStream = this._mainToolbarVisibilitySource.asObservable();

  public updateMainToolbarVisiblity(_lang: any) {
    this._mainToolbarVisibilitySource.next(_lang);
  }


  constructor(
    private _translate: TranslateService
   ) {
  	this.initSettings();
  }

  initSettings() {
    const dtheme = window.sessionStorage.getItem('defaultTheme');
    const dlang = JSON.parse(window.sessionStorage.getItem('defaultLang'));

    // Default settings
    if (dtheme) {
      this.setTheme(dtheme);
    } else {
      this.setTheme('arwiki-light');
    }
    if (dlang && dlang.code) {
      this.setDefaultLang(dlang);
    }
  }

  getDefaultTheme(): string {
  	return this._defaultTheme;
  }

  getDefaultLang(): any {
  	return this._defaultLang;
  }

  setDefaultTheme(_theme: string) {
  	if (_theme) {
    	this._defaultTheme = _theme;
    	window.sessionStorage.setItem('defaultTheme', this._defaultTheme);
      this.updateDefaultThemeObservable(this._defaultTheme);
  	}
  }

  setDefaultLang(_lang: any) {
  	if (_lang) {
      let def = '';
      try {
        def = JSON.stringify(_lang);
        this._defaultLang = _lang;
      } catch (err) {
        this._defaultLang = {};
      }
    	window.sessionStorage.setItem('defaultLang', def);
      this._translate.use(this._defaultLang.code);
      this.updateSettingsLangObservable(this._defaultLang);
  	}
  }

  resetUserSettings() {
  	this._defaultTheme = 'arwiki-light';
  	window.sessionStorage.removeItem('defaultTheme');
  	window.sessionStorage.removeItem('defaultLang');

  }

  /*
  *  Set default theme (Updates the href property)
  */
  setTheme(theme: string) {
    const _ts: any = document.getElementById('LINK_MAIN_THEME');

    if (!_ts) {
      throw Error('Error updating theme');
    }
    switch (theme) {
      case 'arwiki-light':
        _ts.href = `./assets/css/${theme}.css`;
        this.setDefaultTheme(theme);
      break;
      case 'arwiki-dark':
        _ts.href = `./assets/css/${theme}.css`;
        this.setDefaultTheme(theme);
      break;
      default:
      	throw Error('Theme not found!');
      break;
    }

  }

  scrollToTop() {
    const container = document.getElementById('arwiki-mat-sidenav-main-content');
    container.scrollTop = 0;
  }

}
