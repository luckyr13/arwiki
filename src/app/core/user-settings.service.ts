import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {TranslateService} from '@ngx-translate/core';
import {ArwikiLang} from '../core/interfaces/arwiki-lang';
import {ArweaveGateway} from '../core/interfaces/arweave-gateway';
declare const window: any;
declare const document: any;

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {
	_defaultTheme: string = '';
	_defaultLang: ArwikiLang = {
    code: "en",
    native_name: "English",
    writing_system: "LTR",
    iso_name: "English",
    active: true
  };
  
  _defaultNetwork: ArweaveGateway = {
    host: "arweave.net",
    port: 443,
    protocol: 'https',
    useArweaveGW: false,
    contractAddress: 'O3S3xsYrhn3DlDAkCwZCQMLjojx0o_EO7I1Q5kZEsqE'
  };

  // Observable
  private _settingsLangSource = new Subject<ArwikiLang>();

  // Observable stream
  public settingsLangStream = this._settingsLangSource.asObservable();

  public updateSettingsLangObservable(_lang: ArwikiLang) {
    this._settingsLangSource.next(_lang);
  }

  // Observable string source
  private _defaultThemeSource = new Subject<string>();

  // Observable string stream
  public defaultThemeStream = this._defaultThemeSource.asObservable();

  public updateDefaultThemeObservable(_path: string) {
    this._defaultThemeSource.next(_path);
  }

  // Observable
  private _settingsNetworkSource = new Subject<ArweaveGateway>();

  // Observable stream
  public settingsNetworkStream = this._settingsNetworkSource.asObservable();

  public updateSettingsNetworkObservable(_network: ArweaveGateway) {
    this._settingsNetworkSource.next(_network);
  }

  // Observable source
  private _mainToolbarLoadingSource = new Subject<boolean>();

  // Observable stream
  public mainToolbarLoadingStream = this._mainToolbarLoadingSource.asObservable();

  updateMainToolbarLoading(_loading: boolean) {
    this._mainToolbarLoadingSource.next(_loading);
  }

  // Observable source
  private _routeLangSource = new Subject<string>();

  // Observable stream
  public routeLangStream = this._routeLangSource.asObservable();

  public updateRouteLangObservable(_lang: string) {
    this._routeLangSource.next(_lang);
  }

  // Observable source
  private _mainToolbarVisibilitySource = new Subject<boolean>();

  // Observable stream
  public mainToolbarVisibilityStream = this._mainToolbarVisibilitySource.asObservable();
  public mainToolbarVisibility = false;
  public updateMainToolbarVisiblity(_visible: boolean) {
    this.mainToolbarVisibility = _visible;
    this._mainToolbarVisibilitySource.next(_visible);
  }

  // Observable string sources
  private _scrollTopSource = new Subject<number>();

  // Observable string streams
  public scrollTopStream = this._scrollTopSource.asObservable();

  public updateScrollTop(_scroll: number) {
    this._scrollTopSource.next(_scroll);
  }

  constructor(
    private _translate: TranslateService
   ) {
  	this.initSettings();
  }

  initSettings() {
    const dtheme = window.localStorage.getItem('defaultTheme');
    const dlang = JSON.parse(window.localStorage.getItem('defaultLang'));
    const dnetwork = JSON.parse(window.localStorage.getItem('defaultNetwork'));

    // Default settings
    if (dtheme) {
      this.setTheme(dtheme);
    } else {
      this.setTheme('arwiki-light');
    }
    if (dlang && dlang.code) {
      this.setDefaultLang(dlang);
    }
    if (dnetwork && dnetwork.host) {
      this.setDefaultNetwork(dnetwork);
    }
  }

  getDefaultTheme(): string {
  	return this._defaultTheme;
  }

  getDefaultLang(): ArwikiLang {
  	return this._defaultLang;
  }

  getDefaultNetwork(): ArweaveGateway {
    return this._defaultNetwork;
  }

  setDefaultTheme(_theme: string) {
  	if (_theme) {
    	this._defaultTheme = _theme;
    	window.localStorage.setItem('defaultTheme', this._defaultTheme);
      this.updateDefaultThemeObservable(this._defaultTheme);
  	}
  }

  setDefaultLang(_lang: ArwikiLang) {
  	if (_lang) {
      let def = '';
      try {
        def = JSON.stringify(_lang);
        this._defaultLang = _lang;
      } catch (err) {
        // this._defaultLang = {};
        throw Error('setDefaultLang: Error ' + err);
      }
     
      document.documentElement.lang = this._defaultLang.code;

      if (this._defaultLang.writing_system) {
        document.documentElement.dir = this._defaultLang.writing_system;
      }

    	window.localStorage.setItem('defaultLang', def);
      this._translate.use(this._defaultLang.code);
      this.updateSettingsLangObservable(this._defaultLang);
  	}
  }

  resetUserSettings() {
  	this._defaultTheme = 'arwiki-light';
  	window.localStorage.removeItem('defaultTheme');
  	window.localStorage.removeItem('defaultLang');
    window.localStorage.removeItem('defaultNetwork');
  }

  /*
  *  Set default theme (Updates the href property)
  */
  setTheme(theme: string) {
    const _ts: any = document.getElementsByTagName('body')[0];

    if (!_ts) {
      throw Error('Error updating theme');
    }
    switch (theme) {
      case 'arwiki-light':
        _ts.className = theme;
        this.setDefaultTheme(theme);
      break;
      case 'arwiki-dark':
        _ts.className = theme;
        this.setDefaultTheme(theme);
      break;
      case 'arwiki-peach':
        _ts.className = theme;
        this.setDefaultTheme(theme);
      break;
      case 'arwiki-orange':
        _ts.className = theme;
        this.setDefaultTheme(theme);
      break;
      case 'arwiki-yellow':
        _ts.className = theme;
        this.setDefaultTheme(theme);
      break;
      default:
      	console.error('Theme not found!');
      break;
    }

  }

  scrollToTop() {
    const container = document.getElementById('arwiki-mat-sidenav-main-content');
    container.scrollTop = 0;
  }

  scrollTo(to_id: string, offset: number = 0) {
    const container = document.getElementById('arwiki-mat-sidenav-main-content');
    const to = document.getElementById(to_id);
    const toData = to.getBoundingClientRect();
    container.scrollTop += toData.top + offset;
  }

  setDefaultNetwork(_network: ArweaveGateway) {
    if (_network) {
      let def = '';
      try {
        def = JSON.stringify(_network);
        this._defaultNetwork = _network;
      } catch (err) {
        // this._defaultLang = {};
        throw Error('setDefaultNetwork: Error ' + err);
      }
     
      window.localStorage.setItem('defaultNetwork', def);
      this.updateSettingsNetworkObservable(this._defaultNetwork);
    }
  }

}
