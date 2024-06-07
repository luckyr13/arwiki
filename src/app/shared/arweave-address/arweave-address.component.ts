import { Component, Input, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { UtilsService } from '../../core/utils.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { ArweaveService } from '../../core/arweave.service';

@Component({
  selector: 'app-arweave-address',
  templateUrl: './arweave-address.component.html',
  styleUrls: ['./arweave-address.component.scss']
})
export class ArweaveAddressComponent implements OnInit, OnDestroy, OnChanges {
  @Input() address: string = '';
  @Input() isAddress: boolean = true;
  @Input() lang: string = '';
  @Input() showProfileImage: boolean = true;
  @Input() showHandleInAddress: boolean = true;
  @Input() showArCodeLink: boolean = false;
  @Input() showSonArContractLink: boolean = false;
  @Input() showImgArweaveLink: boolean = false;
  
  private _profileSubscription = Subscription.EMPTY;
  public profileImage: string = 'assets/img/blank-profile.png';
  public nickname = '';

  constructor(
    private _clipboard: Clipboard,
    private _utils: UtilsService,
    private _auth: AuthService,
    private _arweave: ArweaveService) {}

  ngOnInit() {
    // Show profile detail
    if (this.isAddress &&
      this.address &&
      (this.showProfileImage || this.showHandleInAddress)) {
      this.updateProfileData();
    }

  }

  ngOnChanges() {
    
  }

  copyClipboard(content: string, msg: string = 'Content copied!') {
    this._clipboard.copy(content);
    this._utils.message(msg, 'success');
  }

  updateProfileData() {
    this._profileSubscription = this._auth.getProfile(this.address).subscribe((profile) => {
      this.profileImage = profile && profile.avatarURL ?
        profile.avatarURL :
        'assets/img/blank-profile.png';
      this.nickname = profile && profile.username ? profile.username : '';

    });
  }

  ngOnDestroy() {
    this._profileSubscription.unsubscribe();
  }

  
  ellipsis(s: string) {
    return this._utils.ellipsis(s);
  }

}
