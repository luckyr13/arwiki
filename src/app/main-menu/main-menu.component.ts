import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UserSettingsService } from '../auth/user-settings.service';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss']
})
export class MainMenuComponent implements OnInit {
	@Input() opened!: boolean;
	@Output() openedChange = new EventEmitter();
  routerLang: string = '';

  constructor(
      private _userSettings: UserSettingsService
    ) { }

  ngOnInit(): void {

    this._userSettings.routeLang$.subscribe((data) => {
      this.routerLang = data;
    });
  }

  toggleSideMenu() {
    this.opened = !this.opened;
    this.openedChange.emit(this.opened);
  }


}
