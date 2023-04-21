import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { ArwikiAdminsService } from '../../core/arwiki-contracts/arwiki-admins.service';
import { Subscription } from 'rxjs';
import { UtilsService } from '../../core/utils.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-moderators-list',
  templateUrl: './moderators-list.component.html',
  styleUrls: ['./moderators-list.component.scss']
})
export class ModeratorsListComponent implements OnInit, OnDestroy {
  adminList: string[] = [];
  adminListSubscription = Subscription.EMPTY;
  routerLang: string = '';

  constructor(
    private _auth: AuthService,
    private _route: ActivatedRoute,
    private _arwikiAdmins: ArwikiAdminsService,
    private _utils: UtilsService) { }

  ngOnInit(): void {
    // Get language from route
    this._route.paramMap.subscribe((params) => {
      this.routerLang = params.get('lang')!;
    });
   
    this.adminListSubscription = this._arwikiAdmins.getAdminList()
      .subscribe({
        next: (adminList) => {
          this.adminList = adminList;
        },
        error: (error) => {
          this._utils.message(error, 'error');
        }
      })
  }

  ngOnDestroy() {
    this.adminListSubscription.unsubscribe();
  }

}
