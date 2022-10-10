import { Component, OnInit, Inject, OnDestroy} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { StampsService } from '../../core/stamps.service';
import { VouchdaoService } from '../../core/vouchdao.service';
import { Observable, Subscription } from 'rxjs';

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

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      address: string, slug: string, lang: string
    },
    private _stamps: StampsService,
    private _vouchdao: VouchdaoService,
    public _dialogRef: MatDialogRef<DialogStampComponent>) { }

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
  }

  stamp() {
    const res = true;
    this._dialogRef.close(res);
  }

}
