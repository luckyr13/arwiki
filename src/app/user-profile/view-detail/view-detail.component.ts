import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserProfile } from '../../core/interfaces/user-profile';
import { AuthService } from '../../auth/auth.service';
import { ArweaveService } from '../../core/arweave.service';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Location } from '@angular/common';

@Component({
  selector: 'app-view-detail',
  templateUrl: './view-detail.component.html',
  styleUrls: ['./view-detail.component.scss']
})
export class ViewDetailComponent implements OnInit {
  address = '';
  currentAddress = '';
  profile: UserProfile|null = null;
  profileSubscription = Subscription.EMPTY;
  defaultAvatar = 'assets/img/blank-profile.png';
  loadingProfile = false;
  
  constructor(
    private _auth: AuthService,
    private _route: ActivatedRoute,
    private _snackBar: MatSnackBar,
    private _location: Location) {
    
  }

  ngOnInit(): void {
    const address = this._route.snapshot.paramMap.get('address')!;
    this.address = '';
    if (address) {
      this.address = address;
      this.loadProfile(this.address);
    }

    this._route.paramMap.subscribe((params) => {
      const address = params.get('address');
      this.address = '';
      if (address) {
        this.address = address;
        this.loadProfile(this.address);
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

}
