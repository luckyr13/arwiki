import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-view-admin-list',
  templateUrl: './view-admin-list.component.html',
  styleUrls: ['./view-admin-list.component.scss']
})
export class ViewAdminListComponent implements OnInit {
	adminList = this._auth.getAdminList();

  constructor(private _auth: AuthService) { }

  ngOnInit(): void {
  }

}
