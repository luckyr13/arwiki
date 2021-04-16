import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { UserSettingsService } from '../../core/user-settings.service';
import { ActivatedRoute } from '@angular/router';

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
    private _userSettings: UserSettingsService,
    private _route: ActivatedRoute
    ) { }

  ngOnInit(): void {
    // Get language from route
    this._route.paramMap.subscribe((params) => {
      this.routerLang = params.get('lang')!;
    });
  }

  goBack() {
    this._location.back();
  }
}
