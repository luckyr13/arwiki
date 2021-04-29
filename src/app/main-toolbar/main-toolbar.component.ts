import { 
  Component, OnInit, OnDestroy, 
  Input, Output, EventEmitter
} from '@angular/core';
import { UserSettingsService } from '../core/user-settings.service';
import { AuthService } from '../auth/auth.service';
import { ArweaveService } from '../core/arweave.service';
import { Subscription, EMPTY, Observable } from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ArwikiLangIndexContract} from '../arwiki-contracts/arwiki-lang-index';
import { FormControl, FormGroup } from '@angular/forms';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import { BottomSheetLoginComponent } from '../shared/bottom-sheet-login/bottom-sheet-login.component';
import { ArwikiSettingsContract } from '../arwiki-contracts/arwiki-settings';
import { ActivatedRoute, Router } from '@angular/router';
declare const window: any;

@Component({
  selector: 'app-main-toolbar',
  templateUrl: './main-toolbar.component.html',
  styleUrls: ['./main-toolbar.component.scss']
})
export class MainToolbarComponent implements OnInit, OnDestroy {
  account: Observable<string>|null = null;
  network: Observable<string> = this._arweave.getNetworkName();
  @Input() opened!: boolean;
  @Output() openedChange = new EventEmitter<boolean>();
  isLoggedIn: boolean = false;
  langsCopy: any;
  langCodes: string[] = [];
  loading = this._userSettings.mainToolbarLoadingStream;
  loadingLangs: boolean = false;
  routerLang: string = '';
  loadingSettings: boolean = true;
  defaultTheme: string = '';
  appName: string = '';
  // appLogoLight: string = './assets/img/arweave-light.png';
  appLogoLight: string = '';
  // appLogoDark: string = './assets/img/arweave-dark.png';
  appLogoDark: string = '';
  appSettingsSubscription: Subscription = Subscription.EMPTY;
  maintoolbarVisible: boolean = false;
  frmSearch: FormGroup = new FormGroup({
    'searchQry': new FormControl('')
  });

  constructor(
    private _auth: AuthService,
    private _arweave: ArweaveService,
    private _snackBar: MatSnackBar,
    private _userSettings: UserSettingsService,
    private _langContract: ArwikiLangIndexContract,
    private _bottomSheet: MatBottomSheet,
    private _arwikiSettings: ArwikiSettingsContract,
    private _route: ActivatedRoute,
    private _router: Router
  ) {}

  get searchQry() {
    return this.frmSearch.get('searchQry');
  }


  ngOnInit(): void {
    this.defaultTheme = this._userSettings.getDefaultTheme();

    this.isLoggedIn = !!this._auth.getMainAddressSnapshot();

  	this._userSettings.mainToolbarVisibilityStream.subscribe((visible) => {
  		this.maintoolbarVisible = visible;
  	});

    // Load languages from contract
    this.loadingLangs = true;
    this._langContract.getState().subscribe((langs: any) => {
      this.langsCopy = langs;
      this.langCodes = Object.keys(this.langsCopy);
      
      this.loadingLangs = false;
    });

    // Get main address from service
    this._auth.account$.subscribe((_address: string) => {
      if (_address) {
        this.isLoggedIn = true;
      }
    });

    // Get language from route
    this._userSettings.routeLangStream.subscribe((data) => {
      this.routerLang = data;
    });

    this.appSettingsSubscription = this._arwikiSettings
      .getState()
      .subscribe({
        next: (state) => {
          this.appName = state.app_name;
          this.appLogoLight = `${this._arweave.baseURL}${state.main_logo_light}`;
          this.appLogoDark = `${this._arweave.baseURL}${state.main_logo_dark}`;
          this.loadingSettings = false;
        },
        error: (error) => {
          this.message(error, 'error');
          this.loadingSettings = false;
        }
      });

  }

  ngOnDestroy() {
    if (this.appSettingsSubscription) {
      this.appSettingsSubscription.unsubscribe();
    }
  }

  /*
  *  Open/close main menu
  */
  toggleSideMenu() {
    this.opened = !this.opened;
    this.openedChange.emit(this.opened);
  }

  /*
  *  Set default theme (Updates the href property)
  */
  setMainTheme(theme: string) {
    try {
      this._userSettings.setTheme(theme);
    } catch (err) {
      this.message(`Error: ${err}`, 'error');
    }
  }

  /*
  *  Set default language
  */
  setLanguage(langCode: string) {
    try {
      this._userSettings.setDefaultLang(this.langsCopy[langCode]);
      this._router.navigate([`/${langCode}`]);
    } catch (err) {
      this.message(`Error: ${err}`, 'error');
    }
  }


  /*
  *  @dev Destroy session
  */
  logout() {
    this._auth.logout();
    this.isLoggedIn = false;
    window.location.reload();
  }


  /*
  *  Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
  }

  /*
  *  @dev Modal login (or bottom sheet)
  */
  login() {
    this._bottomSheet.open(BottomSheetLoginComponent, {
      
    });
  }

  getSkeletonLoaderAnimationType() {
    let type = 'progress';
    if (this.defaultTheme === 'arwiki-dark') {
      type = 'progress-dark';
    }
    return type;
  }

  getSkeletonLoaderThemeNgStyle() {
    let ngStyle: any = {
      'height.px': '30',
      'width.px': '140',
      'margin-top': '24px'
    };
    if (this.defaultTheme === 'arwiki-dark') {
      ngStyle['background-color'] = '#3d3d3d';
    }

    return ngStyle;
  }

  onSearch() {
    const qry = this.searchQry!.value;
    if (!qry) {
      return;
    }

    this._router.navigate([`${this.routerLang}/search/${qry}`]);


  }
}
