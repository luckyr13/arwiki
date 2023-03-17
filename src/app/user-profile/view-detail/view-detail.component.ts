import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserProfile } from '../../core/interfaces/user-profile';
import { AuthService } from '../../auth/auth.service';
import { ArweaveService } from '../../core/arweave.service';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '../../core/utils.service';
import { Location } from '@angular/common';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';
import { UserSettingsService } from '../../core/user-settings.service';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import { Direction } from '@angular/cdk/bidi';
import { DialogDonateComponent } from '../../shared/dialog-donate/dialog-donate.component';
import { ArwikiLang } from '../../core/interfaces/arwiki-lang';
import { Router } from '@angular/router';
import { ArwikiLangsService } from '../../core/arwiki-contracts/arwiki-langs.service';

@Component({
  selector: 'app-view-detail',
  templateUrl: './view-detail.component.html',
  styleUrls: ['./view-detail.component.scss']
})
export class ViewDetailComponent implements OnInit, OnDestroy {
  address = '';
  currentAddress = '';
  profile: UserProfile|null = null;
  profileSubscription = Subscription.EMPTY;
  defaultAvatar = 'assets/img/blank-profile.png';
  loadingProfile = false;
  isAdmin = false;
  isAdminSubscription = Subscription.EMPTY;
  routeLang = '';
  selLanguage = '';
  languages: ArwikiLang[]  = [];

  constructor(
    private _auth: AuthService,
    private _route: ActivatedRoute,
    private _utils: UtilsService,
    private _location: Location,
    private _arwikiToken: ArwikiTokenContract,
    public _dialog: MatDialog,
    private _userSettings: UserSettingsService,
    private _router: Router,
    private _arwikiTokenLangs: ArwikiLangsService) {
    
  }

  ngOnInit(): void {
    const address = this._route.snapshot.paramMap.get('address')!;
    const routeLang = this._route.snapshot.paramMap.get('lang')!;
    this.address = '';
    if (address) {
      this.address = address;
      this.loadProfile(this.address);
      this.isAdminCheck(this.address);
    }
    if (routeLang) {
      this.routeLang = routeLang;
      this.selLanguage = this.routeLang;
    }

    this._route.paramMap.subscribe((params) => {
      const address = params.get('address');
      const routeLang = params.get('lang');
      this.address = '';
      this.routeLang = '';
      if (address) {
        this.address = address;
        this.loadProfile(this.address);
        this.isAdminCheck(this.address);
      }
      if (routeLang) {
        this.routeLang = routeLang;
        this.selLanguage = this.routeLang;
      }
    });

    this.currentAddress = this._auth.getMainAddressSnapshot();
    this._auth.account$.subscribe((account) => {
      this.currentAddress = account;
    });

    this.languages = Object.values(this._arwikiTokenLangs.getLanguagesFromLocal());
    
  }

  loadProfile(address: string) {
    this.loadingProfile = true;
    this.profileSubscription = this._auth.getProfile(address).subscribe({
      next: (profile) => {
        this.profile = null;
        if (profile) {
          this.profile = profile;
        }
        this.loadingProfile = false;
      },
      error: (error) => {
        this.loadingProfile = false;
        this._utils.message(error, 'error');
      }
    })
  }

  goBack() {
    this._location.back();
  }

  ngOnDestroy() {
    this.profileSubscription.unsubscribe();
    this.isAdminSubscription.unsubscribe();
  }

  isAdminCheck(address: string) {
    this.isAdminSubscription = this._arwikiToken.isAdmin(address).subscribe({
      next: (isAdmin) => {
        this.isAdmin = false;
        if (isAdmin) {
          this.isAdmin = true;
        }
      },
      error: (error) => {
        this._utils.message(error, 'error');
      }
    })
  }

  socialLink(handle: string, service: string) {
    let ans = '';
    if (service === 'twitter') {
      ans = `https://twitter.com/${handle}`
    } else if (service === 'youtube') {
      ans = `https://youtube.com/${handle}`
    } else if (service === 'github') {
      ans = `https://github.com/${handle}`
    } else if (service === 'instagram') {
      ans = `https://instagram.com/${handle}`
    } else if (service === 'facebook') {
      ans = `https://facebook.com/${handle}`
    }

    return ans;
  }


  donate() {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';
    const mainAddress = this._auth.getMainAddressSnapshot();
    const dialogRef = this._dialog.open(DialogDonateComponent, {
      data: {
        sponsor: this.address,
        mainAddress: mainAddress
      },
      direction: direction,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async (result) => {
    });
  }

  updateLang(lang: string) {
    this._router.navigate(['/', lang, 'user', this.address]);
  }



}
