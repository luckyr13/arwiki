import { 
  Component, OnInit, OnDestroy, 
  Input, Output, EventEmitter
} from '@angular/core';
import { UserSettingsService } from '../core/user-settings.service';
import { AuthService } from '../auth/auth.service';
import { ArweaveService } from '../core/arweave.service';
import { Subscription, EMPTY, Observable } from 'rxjs';
import { UtilsService } from '../core/utils.service';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import { BottomSheetLoginComponent } from '../shared/bottom-sheet-login/bottom-sheet-login.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { 
  DialogSelectLanguageComponent 
} from '../shared/dialog-select-language/dialog-select-language.component';
import { ArwikiLang } from '../core/interfaces/arwiki-lang';
import { Direction } from '@angular/cdk/bidi';
import { of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { UserProfile } from '../core/interfaces/user-profile';
import { ArwikiAdminsService } from '../core/arwiki-contracts/arwiki-admins.service';

@Component({
  selector: 'app-main-toolbar',
  templateUrl: './main-toolbar.component.html',
  styleUrls: ['./main-toolbar.component.scss']
})
export class MainToolbarComponent implements OnInit, OnDestroy {
  account = '';
  method = '';
  @Input() opened!: boolean;
  @Output() openedChange = new EventEmitter<boolean>();
  isLoggedIn: boolean = false;
  isModerator: boolean = false;
  loading = this._userSettings.mainToolbarLoadingStream;
  routerLang: string = '';
  defaultTheme: string = '';
  appName: string = 'Arweave';
  maintoolbarVisible: boolean = false;
  frmSearch: UntypedFormGroup = new UntypedFormGroup({
    'searchQry': new UntypedFormControl('', [Validators.required])
  });
  profileImage: string = 'assets/img/blank-profile.png';
  profileSubscription = Subscription.EMPTY;
  profile: UserProfile|null = null;
  adminsSubscription = Subscription.EMPTY;

  constructor(
    private _auth: AuthService,
    private _arweave: ArweaveService,
    private _utils: UtilsService,
    private _userSettings: UserSettingsService,
    private _bottomSheet: MatBottomSheet,
    private _route: ActivatedRoute,
    private _router: Router,
    private _dialog: MatDialog,
    private _arwikiAdmins: ArwikiAdminsService
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

    // Get main address from service
    this._auth.account$.subscribe((_address: string) => {
      if (_address) {
        this.isLoggedIn = true;
        this.updateProfileData();
        this.validateIfUserIsModerator(_address);
      }
    });

    // Get language from route
    this._userSettings.routeLangStream.subscribe((data) => {
      this.routerLang = data;
    });

    this._auth.userIsModeratorStream.subscribe({
      next: (_isModerator) => {
        this.isModerator = _isModerator;
      },
      error: (error) => {
        this._utils.message(error, 'error');
      }
    });

    // Load profile image
    if (this.isLoggedIn) {
      this.updateProfileData();
    }

  }

  updateProfileData() {
    const mainAddress = this._auth.getMainAddressSnapshot();
    this.account = mainAddress;
        this.method = this._auth.loginMethod;
    this.profileSubscription = this._auth.getProfile(mainAddress).subscribe((profile) => {
      if (profile) {
        this.profile = profile;
        if (profile.avatarURL) {
          this.profileImage = profile.avatarURL;
        }
      } else {
        this.profile = null;
        this.profileImage = 'assets/img/blank-profile.png';
      }

    });
  }

  ngOnDestroy() {
    this.profileSubscription.unsubscribe();
    this.adminsSubscription.unsubscribe();
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
      this._utils.message(`Error: ${err}`, 'error');
    }
  }

  /*
  *  Set default language
  */
  setLanguage(lang: ArwikiLang) {
    try {
      this._userSettings.setDefaultLang(lang);
      this._router.navigate([`/${lang.code}`]);
    } catch (err) {
      this._utils.message(`Error: ${err}`, 'error');
    }
  }


  /*
  *  @dev Destroy session
  */
  async logout() {
    await this._auth.logout();
    this.isLoggedIn = false;
    window.location.reload();
  }

  /*
  *  @dev Modal login (or bottom sheet)
  */
  login() {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';
    
    this._bottomSheet.open(BottomSheetLoginComponent, {
      direction: direction
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

  openLangModal() {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';
    
    const dialogRef = this._dialog.open(DialogSelectLanguageComponent, {
      width: '650px',
      data: {},
      direction: direction
    });

    dialogRef.afterClosed().subscribe((lang: ArwikiLang) => {
      if (lang && lang.code) {
        this.setLanguage(lang);
      }
    });
  }

  ellipsis(s: string) {
    return this._utils.ellipsis(s);
  }

  validateIfUserIsModerator(address:string) {
    this.adminsSubscription = this._arwikiAdmins.isAdmin(
      address
    ).subscribe({
      next: (isAdmin) => {
        this._auth.updateUserIsModerator(isAdmin);
      },
      error: (error) => {
        this._utils.message(error, 'error');
      }
    })
    
  }
}
