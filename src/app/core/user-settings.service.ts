import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {TranslateService} from '@ngx-translate/core';
declare const window: any;

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {
	_defaultTheme: string = '';
	_defaultLang: any = '';

	// Observable string sources
  private routePath = new Subject<string>();

  // Observable string streams
  public routePath$ = this.routePath.asObservable();

  updatePath(_path: string) {
  	this.routePath.next(_path);
  }

  // Observable string sources
  private routeLang = new Subject<string>();

  // Observable string streams
  public routeLang$ = this.routeLang.asObservable();

  public updatePathLang(_path: string) {
    this.routeLang.next(_path);
  }

  // Observable string sources
  private langObservable = new Subject<any>();

  // Observable string streams
  public langObservable$ = this.langObservable.asObservable();

  public updateLangObservable(_lang: any) {
    this.langObservable.next(_lang);
  }

  // Observable string sources
  private defaultThemeObservable = new Subject<string>();

  // Observable string streams
  public defaultThemeObservable$ = this.defaultThemeObservable.asObservable();

  public updateDefaultThemeObservable(_path: string) {
    this.defaultThemeObservable.next(_path);
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
    } else {
      this.setDefaultLang(this.getBaseLang());
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
        def = JSON.stringify(this.getBaseLang());
        this._defaultLang = this.getBaseLang();
      }
    	window.sessionStorage.setItem('defaultLang', def);
      this._translate.use(this._defaultLang.code);
      this.updateLangObservable(this._defaultLang);
  	}
  }

  resetUserSettings() {
  	this._defaultLang = this.getBaseLang();
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

  getBaseLang() {
    return {
      "code": "en",
      "iso_name": "English",
      "native_name": "English",
      "numPages": 0,
      "writing_system": "LTR",
      "contract": ""
    };
  }

}
