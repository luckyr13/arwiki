import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserProfile } from '../../core/interfaces/user-profile';
import { AuthService } from '../../auth/auth.service';
import { ArweaveService } from '../../core/arweave.service';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Location } from '@angular/common';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';

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

  constructor(
    private _auth: AuthService,
    private _route: ActivatedRoute,
    private _snackBar: MatSnackBar,
    private _location: Location,
    private _arwikiToken: ArwikiTokenContract) {
    
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
      }
    });

    this.currentAddress = this._auth.getMainAddressSnapshot();
    this._auth.account$.subscribe((account) => {
      this.currentAddress = account;
    });


    
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
        this.message(error, 'error');
      }
    })
  }

  /*
  *  Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 8000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
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
        this.message(error, 'error');
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

}
