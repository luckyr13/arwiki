import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { arwikiVersion } from '../../core/arwiki';
import { AuthService } from '../../auth/auth.service';
import { ArwikiAtomicNftService } from '../../core/arwiki-contracts/arwiki-atomic-nft.service';

@Component({
  selector: 'app-dialog-claim-nft',
  templateUrl: './dialog-claim-nft.component.html',
  styleUrls: ['./dialog-claim-nft.component.scss']
})
export class DialogClaimNftComponent implements OnInit, OnDestroy {
  loading = false;
  nftStateSubscription = Subscription.EMPTY;
  nftOwner = '';
  nftTransferSubscription = Subscription.EMPTY;
  errorMsg = '';
  transferTX = '';

  constructor(
    private _dialogRef: MatDialogRef<DialogClaimNftComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      langCode: string,
      slug: string,
      sponsor: string,
      nft: string
    },
    private _auth: AuthService,
    private _atomicNft: ArwikiAtomicNftService
  ) { }


  close(res: { tx: string, type: string, content: string }|undefined = undefined) {
    this._dialogRef.close(res);
  }

  ngOnInit() {
    this.readNFTState();
  }

  ngOnDestroy() {
    this.nftStateSubscription.unsubscribe();
    this.nftTransferSubscription.unsubscribe();
  }

  readNFTState() {
    if (!this.data.nft) {
      return;
    }
    this.loading = true;
    this.nftStateSubscription = this._atomicNft.getState(this.data.nft).subscribe({
      next: (state) => {
        if (state) {
          const balances = state.balances ? 
            state.balances : {};
          for (const address in balances) {
            if (balances[address] > 0) {
              this.nftOwner = address;
            }
          }

        }
        this.loading = false;
      },
      error: (error) => {
        console.error('readNFTState', error);
        this.loading = false;

      }
    });
  }

  transfer() {
    this.loading = true;
    const jwk = this._auth.getPrivateKey();
    const qty = 1;
    const target = this.data.sponsor;
    
    this.nftTransferSubscription = this._atomicNft.transfer(
      target, qty, this.data.nft, jwk, arwikiVersion[0]
    ).subscribe({
      next: (res) => {
        let tx = '';
        if (res && Object.prototype.hasOwnProperty.call(res, 'originalTxId')) {
          tx = res.originalTxId;
        } else if (res && Object.prototype.hasOwnProperty.call(res, 'bundlrResponse') &&
          res.bundlrResponse && Object.prototype.hasOwnProperty.call(res.bundlrResponse, 'id')) {
          tx = res.bundlrResponse.id;
        }
        this.transferTX = `${tx}`
        this.loading = false;

      },
      error: (error) => {
        this.errorMsg = 'Error!';
        if (typeof error === 'string') {
          this.errorMsg = `${error}`;
        } else if (typeof error === 'object' && error && error.message) {
          this.errorMsg = `${error.message}`;
        }
        console.error('transfer', error);
        this.loading = false;
      }
    });

  }




}
