import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { ActivatedRoute } from '@angular/router';
import { ArwikiAdminsService } from '../../core/arwiki-contracts/arwiki-admins.service';
import { Subscription } from 'rxjs';
import { UtilsService } from '../../core/utils.service';

@Component({
  selector: 'app-view-admin-list',
  templateUrl: './view-admin-list.component.html',
  styleUrls: ['./view-admin-list.component.scss']
})
export class ViewAdminListComponent implements OnInit, OnDestroy {
	adminList: string[] = [];
  routerLang: string = '';
  adminListSubscription = Subscription.EMPTY;

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
