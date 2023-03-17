import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { ArwikiLang } from '../../core/interfaces/arwiki-lang';
import { ArwikiLangsService } from '../../core/arwiki-contracts/arwiki-langs.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import {
  DialogNewLanguageComponent 
} from '../dialog-new-language/dialog-new-language.component';
import {
  DialogEditLanguageComponent 
} from '../dialog-edit-language/dialog-edit-language.component';
import { Direction } from '@angular/cdk/bidi';
import { UserSettingsService } from '../../core/user-settings.service';

@Component({
  selector: 'app-languages',
  templateUrl: './languages.component.html',
  styleUrls: ['./languages.component.scss']
})
export class LanguagesComponent implements OnInit, OnDestroy {
  loading = false;
  langs: Record<string, ArwikiLang> = {};
  langsSubscription = Subscription.EMPTY;
  displayedColumns: string[] = [
    'code', 'writing_system', 'native_name',
    'iso_name', 'active', 'actions'
  ];
  dataSource: ArwikiLang[] = [];

  constructor(
    private _location: Location,
    private _tokenContractLangs: ArwikiLangsService,
    private _dialog: MatDialog,
    private _userSettings: UserSettingsService) {

  }

  goBack() {
    this._location.back();
  }

  ngOnInit() {
    this.loadLangsTable(false);
  }

  loadLangsTable(reload: boolean) {
    this.loading = true;
    const onlyActive = true;
    this.langsSubscription = this._tokenContractLangs.getLanguages(
        onlyActive, reload
      ).subscribe({
        next: (langs) => {
          this.langs = langs;
          this.dataSource = Object.values(this.langs);
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          console.error('ErrorLang:', error);
        }
      });
  }

  ngOnDestroy() {
    this.langsSubscription.unsubscribe();
  }

  openNewLangModal() {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';
    
    const dialogRef = this._dialog.open(DialogNewLanguageComponent, {
      width: '650px',
      data: {},
      direction: direction,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((tx: string) => {
      if (tx) {
        // Reload
        this.loadLangsTable(true);
      }
    });
  }

  openEditLangModal(langCode: string) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';
    const language = this.langs[langCode];
    
    const dialogRef = this._dialog.open(DialogEditLanguageComponent, {
      width: '650px',
      data: {
        language
      },
      direction: direction,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((tx: string) => {
      if (tx) {
        // Reload
        this.loadLangsTable(true);
      }
    });
  }



}
