import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { UserSettingsService } from '../../core/user-settings.service';

@Component({
  selector: 'app-moderators-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  @Input() title: string = ''; 
  routerLang: string = '';

  constructor(
    private _location: Location,
    private _userSettings: UserSettingsService
    ) { }

  ngOnInit(): void {
    // Get language from route
    this.routerLang = this._userSettings.getRouteLangStaticCopy();
    this._userSettings.routeLang$.subscribe((data) => {
      this.routerLang = data;
    });
  }

  goBack() {
    this._location.back();
  }
}
