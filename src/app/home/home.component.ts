import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserSettingsService } from '../auth/user-settings.service';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  constructor(
    private _userSettings: UserSettingsService
  ) { }

  ngOnInit(): void {
  	// This helps to hide the main toolbar
  	this._userSettings.updatePath('home');
  }

  ngOnDestroy() {
  	// This helps to hide the main toolbar
  	this._userSettings.updatePath('');
  }

}
