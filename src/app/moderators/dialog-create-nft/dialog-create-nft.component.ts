import { 
  Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { ArweaveService } from '../../core/arweave.service';
import { Subscription, switchMap } from 'rxjs';
import { UtilsService } from '../../core/utils.service';
import { 
  AuthService 
} from '../../auth/auth.service';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import { ArwikiAtomicNftService } from '../../core/arwiki-contracts/arwiki-atomic-nft.service';
import { UserSettingsService } from '../../core/user-settings.service';

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
    },
    private _arwikiAtomicNFT: ArwikiAtomicNftService,
    private _userSettings: UserSettingsService) {
  }

  ngOnInit() {
    
  }

  ngOnDestroy() {
    this.submitSubscription.unsubscribe();
  }


  createNFT() {
    this.loading = true;
    const qty = 1;
    const target = this.data.sponsor;
    const linkedContractAddress = this._userSettings.getDefaultNetwork().contractAddress;
    const title = this.data.title;
    const langCode = this.data.langCode;
    const slug = this.data.slug;
    const img = this.data.img;
    const disableBundling = false;
    const method = this._auth.loginMethod;
    const jwk = this._auth.getPrivateKey();

    this.submitSubscription = this._arweave.getNetworkInfo().pipe(
      switchMap((networkInfo) => {
        const createdAt = networkInfo.height;
        return this._arwikiAtomicNFT.createNFT(
          target,
          qty,
          linkedContractAddress,
          title,
          langCode,
          slug,
          img,
          jwk,
          method,
          createdAt,
          disableBundling
        );
      })
    ).subscribe({
      next: (res) => {
        if (res && res.contractTxId) {
          this.tx = res.contractTxId;
        }
        this.loading = false;
      },
      error: (error) => {
        this._utils.message(error, 'error');
        this.error = error;
        console.error(error);
        this.loading = false;
      }
    })


      
  }


}
