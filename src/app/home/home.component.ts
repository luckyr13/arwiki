import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserSettingsService } from '../auth/user-settings.service';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  param: any = { value: 'world'}
  constructor(
    private _userSettings: UserSettingsService
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy() {
  }

}
