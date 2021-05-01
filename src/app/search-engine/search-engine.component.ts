import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { 
  DialogSelectLanguageComponent 
} from '../shared/dialog-select-language/dialog-select-language.component';
import { UserSettingsService } from '../core/user-settings.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-engine',
  templateUrl: './search-engine.component.html',
  styleUrls: ['./search-engine.component.scss']
})
export class SearchEngineComponent implements OnInit {
	searchForm: FormGroup = new FormGroup({
		'query': new FormControl('', [Validators.required])
	});
  defaultLang: any;

  get query() {
    return this.searchForm.get('query');
  }
  
  constructor(
    private _dialog: MatDialog,
    private _userSettings: UserSettingsService,
    private _snackBar: MatSnackBar,
    private _router: Router
  ) { }

  ngOnInit(): void {

    this.defaultLang = this._userSettings.getDefaultLang();

    if (Object.keys(this.defaultLang).length <= 0) {
      // this.openSelectLanguageDialog();
      // Define English as default 
      this.defaultLang = {
        code: "en",
        native_name: "English"
      }
    }

  }

  onSubmitSearch() {
    const query = encodeURI(this.query!.value);
    this._router.navigate([`${this.defaultLang.code}/search/${query}`]);
  }

  openSelectLanguageDialog(): void {
    const dialogRef = this._dialog.open(DialogSelectLanguageComponent, {
      width: '650px',
      data: {},
    });

    dialogRef.afterClosed().subscribe(lang => {
      if (lang) {
        this.defaultLang = lang;
        this.setMainLang(this.defaultLang);
      }

    });
  }

  /*
  *
  */
  setMainLang(lang: any) {
    try {
      this._userSettings.setDefaultLang(lang);
    } catch (err) {
      this.message(`Error: ${err}`, 'error');
    }
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

}
