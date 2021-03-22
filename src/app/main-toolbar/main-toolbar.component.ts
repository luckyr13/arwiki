import { Component, OnInit } from '@angular/core';
import { UserSettingsService } from '../auth/user-settings.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-toolbar',
  templateUrl: './main-toolbar.component.html',
  styleUrls: ['./main-toolbar.component.scss']
})
export class MainToolbarComponent implements OnInit {
	routePathSubscription: Subscription = Subscription.EMPTY;
	routePath: string = '';

  constructor(private _userSettings: UserSettingsService) { }

  ngOnInit(): void {
  	this._userSettings.routePath$.subscribe((path) => {
  		this.routePath = path;
  	});

  }

}
