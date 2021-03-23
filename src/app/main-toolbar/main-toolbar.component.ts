import { 
  Component, OnInit, OnDestroy, 
  Input, Output, EventEmitter
} from '@angular/core';
import { UserSettingsService } from '../auth/user-settings.service';
import { AuthService } from '../auth/auth.service';
import { ArweaveService } from '../auth/arweave.service';
import { Subscription, EMPTY, Observable } from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
declare const window: any;

@Component({
  selector: 'app-main-toolbar',
  templateUrl: './main-toolbar.component.html',
  styleUrls: ['./main-toolbar.component.scss']
})
export class MainToolbarComponent implements OnInit, OnDestroy {
  account: Observable<string>|null = null;
  network: Observable<string> = this._arweave.getNetworkName();
	routePathSubscription: Subscription = Subscription.EMPTY;
	routePath: string = '';
  @Input() opened!: boolean;
  @Output() openedChange = new EventEmitter<boolean>();
  isLoggedIn: boolean = false;

  constructor(
    private _auth: AuthService,
    private _arweave: ArweaveService,
    private _snackBar: MatSnackBar,
    private _userSettings: UserSettingsService
  ) {}


  ngOnInit(): void {
  	this._userSettings.routePath$.subscribe((path) => {
  		this.routePath = path;
  	});

  }

  ngOnDestroy() {

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

    } catch (err) {
      this.message(`Error: ${err}`, 'error');
    }
  }

  /*
  *  @dev Destroy session
  */
  logout() {
    
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
    
  }
}
