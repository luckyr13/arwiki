import { Component, Input, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { ArverifyMapService } from '../../core/arverify-map.service'
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { ArweaveService } from '../../core/arweave.service'

@Component({
  selector: 'app-arweave-address',
  templateUrl: './arweave-address.component.html',
  styleUrls: ['./arweave-address.component.scss']
})
export class ArweaveAddressComponent implements OnInit, OnDestroy, OnChanges {
  public verified: boolean = false;
  @Input() address: string = '';
  @Input() isAddress: boolean = true;
  @Input() lang: string = '';
  @Input() showProfileImage: boolean = true;
  @Input() showHandleInAddress: boolean = true;
  
  private _profileSubscription = Subscription.EMPTY;
  public profileImage: string = 'assets/img/blank-profile.png';
  public nickname = '';

  constructor(
    private _arverifyMap: ArverifyMapService,
    private _clipboard: Clipboard,
    private _snackBar: MatSnackBar,
    private _auth: AuthService,
    private _arweave: ArweaveService) {}

  async ngOnInit() {
  }

  async ngOnChanges() {
    if (this.isAddress && this.address) {
      let verificationResult = await this._arverifyMap.getVerification(this.address)
      this.verified = verificationResult && verificationResult.verified

      this.updateProfileData();
    }
  }

  copyClipboard(content: string, msg: string = 'Content copied!') {
    this._clipboard.copy(content);
    this.message(msg, 'success');
  }

  /*
  *  Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
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
    const minLength = 12;
    const sliceLength = 5;

    if (!s || typeof(s) !== 'string') {
      return '';
    }

    return s && s.length < minLength ? s : `${s.substring(0, sliceLength)}...${s.substring(s.length - sliceLength, s.length)}`;
  }

}
