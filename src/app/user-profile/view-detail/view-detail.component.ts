import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserProfile } from '../../core/interfaces/user-profile';
import { AuthService } from '../../auth/auth.service';
import { ArweaveService } from '../../core/arweave.service';

@Component({
  selector: 'app-view-detail',
  templateUrl: './view-detail.component.html',
  styleUrls: ['./view-detail.component.scss']
})
export class ViewDetailComponent implements OnInit {
  address = '';
  profile: UserProfile|null = null;
  profileSubscription = Subscription.EMPTY;
  
  constructor(private _auth: AuthService) {
    
  }

  ngOnInit(): void {
  }

}
