import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-view-admin-list',
  templateUrl: './view-admin-list.component.html',
  styleUrls: ['./view-admin-list.component.scss']
})
export class ViewAdminListComponent implements OnInit {
	adminList = this._auth.getAdminList();
  routerLang: string = '';

  constructor(
    private _auth: AuthService,
    private _route: ActivatedRoute) { }

  ngOnInit(): void {
    // Get language from route
    this._route.paramMap.subscribe((params) => {
      this.routerLang = params.get('lang')!;
    });
  }

}
