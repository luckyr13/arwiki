import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { arwikiVersion, arwikiAppVersion, serviceName } from '../../core/arwiki';
import { UserSettingsService } from '../../core/user-settings.service';
import { ArweaveGateway } from '../../core/interfaces/arweave-gateway';

@Component({
  selector: 'app-app-info',
  templateUrl: './app-info.component.html',
  styleUrls: ['./app-info.component.scss']
})
export class AppInfoComponent implements OnInit {
  loading = false;
  arwikiVersion = '';
  arwikiProtocol = '';
  appVersion = '';
  networkInfo: ArweaveGateway|null = null;


  constructor(
    private _location: Location,
    private _userSettings: UserSettingsService) {

  }

  goBack() {
    this._location.back();
  }

  ngOnInit() {
    this.arwikiProtocol = serviceName;
    this.arwikiVersion = arwikiVersion[0];
    this.appVersion = arwikiAppVersion;
    this.networkInfo = this._userSettings.getDefaultNetwork();
  }
}
