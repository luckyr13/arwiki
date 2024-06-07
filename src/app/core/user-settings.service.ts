import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import {TranslateService} from '@ngx-translate/core';
import {ArwikiLang} from '../core/interfaces/arwiki-lang';
import {ArweaveGateway} from '../core/interfaces/arweave-gateway';
import { UtilsService } from './utils.service';

declare const window: any;
declare const document: any;

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {
	private _defaultTheme: string = '';
	private _defaultLang: ArwikiLang = {
    code: "en",
    native_name: "English",
    writing_system: "LTR",
    iso_name: "English",
    active: true
  };
  
  private _defaultNetwork: ArweaveGateway = {
    host: "arweave.net",
    port: 443,
    protocol: 'https',
    useArweaveGW: true,
    // Current stable contract
    // Tx Deployed directly to Arweave network
    contractAddress: 'mD5P_j8Sd-EbtkTraPJEebBfFQUc_4ooCEA0ylpby6w'
    // Bundled tx
    // jrfpo_Ihv2cHiUi0rsq0ZbI76GdS9kciRPmjvyRIFqM
    // Testing contract
    // contractAddress: 'NUQkXe-8Akd5jw13hzWzfdepGg07Fg_HHimXCqy8BM4'
  };

  // Empty strings on this values if you
  // want to read the values from the contract state (settings array)
  // or set the values to override this behavior.
  private _tokenTicker = '';
  private _appName = '';
  private _appLogo = '';
  private _protocolName = '';
  private _protocolVersion = '';
  private _socialMediaLinks: Record<string, string> = {
    'socialMediaGitHub': '',
    'socialMediaDiscord': '',
    'socialMediaX': '',
    'socialMediaYoutube': '',
    'socialMediaInstagram': '',
    'socialMediaFacebook': '',
    'socialMediaPublicSquare': '',
    'socialMediaNarrative': ''
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

  // Observable string source
  private _appNameSource = new Subject<string>();

  // Observable string stream
  public appNameStream = this._appNameSource.asObservable();

  public updateAppNameObservable(appName: string) {
    this._appName = appName;
    this._appNameSource.next(appName);
  }

  public getAppName() {
    return this._appName;
  }

  // Observable string source
  private _appLogoSource = new Subject<string>();

  // Observable string stream
  public appLogoStream = this._appLogoSource.asObservable();

  public updateAppLogoObservable(appLogo: string) {
    this._appLogo = appLogo;
    this._appLogoSource.next(appLogo);
  }

  public getAppLogo() {
    return this._appLogo;
  }

  // Observable string source
  private _protocolNameSource = new Subject<string>();

  // Observable string stream
  public protocolNameStream = this._protocolNameSource.asObservable();

  public updateProtocolNameObservable(protocol: string) {
    this._protocolName = protocol;
    this._protocolNameSource.next(protocol);
  }

  public getProtocolName() {
    return this._protocolName;
  }

  // Observable string source
  private _protocolVersionSource = new Subject<string>();

  // Observable string stream
  public protocolVersionStream = this._protocolVersionSource.asObservable();

  public updateProtocolVersionObservable(version: string|number) {
    if (typeof version === 'number') {
      version = `${version}`;
    }
    this._protocolVersion = version;
    this._protocolVersionSource.next(version);
  }

  public getProtocolVersion() {
    return this._protocolVersion;
  }

  // Observable string source
  private _socialMediaLinksSource = new BehaviorSubject<Record<string, string>>({});

  // Observable string stream
  public socialMediaLinksStream = this._socialMediaLinksSource.asObservable();

  public updatesocialMediaLinks(socialMedia: string, handleOrLink: string) {
    switch(socialMedia) {
      case 'socialMediaGitHub':
        this._socialMediaLinks[socialMedia] = `https://github.com/${handleOrLink}`;
      break;
      case 'socialMediaDiscord':
        this._socialMediaLinks[socialMedia] = handleOrLink;

      break;
      case 'socialMediaX':
        this._socialMediaLinks[socialMedia] = `https://x.com/${handleOrLink}`;
        
      break;
      case 'socialMediaYoutube':
        this._socialMediaLinks[socialMedia] = `https://youtube.com/${handleOrLink}`;
        
      break;
      case 'socialMediaInstagram':
        this._socialMediaLinks[socialMedia] = `https://instagram.com/${handleOrLink}`;
        
      break;
      case 'socialMediaFacebook':
        this._socialMediaLinks[socialMedia] = `https://facebook.com/${handleOrLink}`;
        
      break;
      case 'socialMediaPublicSquare':
        this._socialMediaLinks[socialMedia] = `https://publicsquare.social/#/${handleOrLink}`;
        
      break;
      case 'socialMediaNarrative':
        this._socialMediaLinks[socialMedia] = `https://narrative.social/#/${handleOrLink}`;
        
      break;
      default:
        // Do nothing
    }
  }

  public updatesocialMediaLinksObservable() {
    this._socialMediaLinksSource.next(this._socialMediaLinks);
  }

  public getSocialMediaLinks() {
    return this._utils.cloneObject(this._socialMediaLinks);
  }

  private _cookiesAccepted = false;

  constructor(
    private _translate: TranslateService,
    private _utils: UtilsService
   ) {
  	this.initSettings();
  }

  initSettings() {
    const dtheme = window.localStorage.getItem('defaultTheme');
    const dlang = JSON.parse(window.localStorage.getItem('defaultLang'));
    const dnetwork = JSON.parse(window.localStorage.getItem('defaultNetwork'));
    const dcookiesAccepted = JSON.parse(window.localStorage.getItem('cookiesAccepted'));

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
    if (dcookiesAccepted) {
      this.setCookiesAccepted(dcookiesAccepted);
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

  getCookiesAccepted(): boolean {
    return this._cookiesAccepted;
  }

  getTokenTicker(): string {
    return this._tokenTicker;
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

  setCookiesAccepted(_cookiesAccepted: boolean) {
    if (_cookiesAccepted) {
      this._cookiesAccepted = _cookiesAccepted;
      window.localStorage.setItem('cookiesAccepted', this._cookiesAccepted);
    }
  }

  setTokenTicker(ticker: string) {
    this._tokenTicker = ticker;
  }

  resetUserSettings() {
  	this._defaultTheme = 'arwiki-light';
  	window.localStorage.removeItem('defaultTheme');
  	window.localStorage.removeItem('defaultLang');
    window.localStorage.removeItem('defaultNetwork');
    window.localStorage.removeItem('cookiesAccepted');
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

  isDarkTheme(theme: string) {
    const dark = ['arwiki-dark'];
    if (dark.indexOf(theme) >= 0) {
      return true;
    }
    return false;
  }

}
