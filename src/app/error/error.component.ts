import { Component, OnInit } from '@angular/core';
import { UserSettingsService } from '../core/user-settings.service';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss']
})
export class ErrorComponent implements OnInit {
	mainToolbarLoading: boolean = true;

  constructor(private _userSettings: UserSettingsService) {

  }

  ngOnInit(): void {
  	this._userSettings.mainToolbarLoadingStream.subscribe((_loading) => {
  		this.mainToolbarLoading = _loading;
  	})
  	this._userSettings.updateMainToolbarLoading(false);
  }

}
