import { Component, OnInit, Inject, OnDestroy} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { StampsWrapper } from '../../core/stamps-wrapper';
import { VouchDaoService } from '../../core/vouch-dao.service';
import { Observable, Subscription } from 'rxjs';
import { WarpContractsService } from '../../core/warp-contracts.service';

@Component({
  selector: 'app-dialog-stamp',
  templateUrl: './dialog-stamp.component.html',
  styleUrls: ['./dialog-stamp.component.scss']
})
export class DialogStampComponent implements OnInit, OnDestroy {
  loadingVouchStatus = false;
  loadingStampPage = false;
  vouchStatusSubscription = Subscription.EMPTY;
  errorMsg = '';
  isVouched = false;
  stampsWrapper: StampsWrapper;
  stampingSubscription = Subscription.EMPTY;
  stampTxMessage = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      address: string, slug: string, lang: string, nft: string
    },
    private _vouchdao: VouchDaoService,
    public _dialogRef: MatDialogRef<DialogStampComponent>,
    private _warp: WarpContractsService) {
    this.stampsWrapper = new StampsWrapper(this._warp.warp);
  }

  ngOnInit(): void {
    this.errorMsg = '';
    this.isVouched = false;
    this.loadingVouchStatus = false;

    if (this.data.address) {
      this.loadingVouchStatus = true;
      const address = this.data.address;
      this.vouchStatusSubscription = this._vouchdao.isVouched(address)
        .subscribe({
          next: (isVouched) => {
            this.isVouched = isVouched;
            this.loadingVouchStatus = false;
          },
          error: (error) => {
            this.errorMsg = `Error: ${error}`;
            this.loadingVouchStatus = false;
          }
        });
    }
  }

  ngOnDestroy() {
    this.vouchStatusSubscription.unsubscribe();
    this.stampingSubscription.unsubscribe();
  }

  stamp() {
    let res = false;
    this.loadingStampPage = true;
    const nft = this.data.nft;
    this.stampingSubscription = this.stampsWrapper.stamp(nft, 0, []).subscribe({
      next: (res) => {
        let tx = '';
        if (res && Object.prototype.hasOwnProperty.call(res, 'originalTxId')) {
          tx = res.originalTxId;
        } else if (res && Object.prototype.hasOwnProperty.call(res, 'bundlrResponse') &&
          res.bundlrResponse && Object.prototype.hasOwnProperty.call(res.bundlrResponse, 'id')) {
          tx = res.bundlrResponse.id;
        }

        if (tx) {
          this.stampTxMessage = `${tx}`;
        } else {
          this.errorMsg = 'Error';
        }
        
        this.loadingStampPage = false;
        console.log('stamped', res);
      },
      error: (error) => {
        this.loadingStampPage = false;
        this.errorMsg = 'Error Stamping page!';
        if (typeof error === 'string') {
          this.errorMsg = `${error}`;
        } else if (typeof error === 'object' && error && error.message) {
          this.errorMsg = `${error.message}`;
        }
        console.error('stamp', error);
      }
    });


    // this._dialogRef.close(res);
  }

}
