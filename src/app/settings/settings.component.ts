import { Component, OnInit } from '@angular/core';
import { UserSettingsService } from '../core/user-settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  mainToolbarLoading = true;
  isMainToolbarVisible = false;

  constructor(private _userSettings: UserSettingsService) {

  }

  ngOnInit(): void {
    this._userSettings.mainToolbarLoadingStream.subscribe((_loading) => {
      this.mainToolbarLoading = _loading;
    });
    this._userSettings.updateMainToolbarLoading(false);
    this.isMainToolbarVisible = this._userSettings.mainToolbarVisibility;
  }


}
