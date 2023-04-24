import { 
  Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { ArweaveService } from '../../core/arweave.service';
import { Subscription } from 'rxjs';
import { UtilsService } from '../../core/utils.service';
import { 
  arwikiVersion 
} from '../../core/arwiki';
import { 
  AuthService 
} from '../../auth/auth.service';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-create-nft',
  templateUrl: './dialog-create-nft.component.html',
  styleUrls: ['./dialog-create-nft.component.scss']
})
export class DialogCreateNftComponent implements OnInit, OnDestroy {
  loading = false;
  tx = '';
  error = '';
  submitSubscription = Subscription.EMPTY;

  constructor(
    private _arweave: ArweaveService,
    private _utils: UtilsService,
    private _auth: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: {
      langCode: string,
      slug: string,
      img: string,
      sponsor: string,
      title: string
    }) {
  }

  ngOnInit() {
    
  }

  ngOnDestroy() {
    this.submitSubscription.unsubscribe();
  }


  onSubmit() {
    
      
  }


}
