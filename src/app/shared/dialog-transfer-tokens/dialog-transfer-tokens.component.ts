import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Validators } from '@angular/forms';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';
import { ArweaveService } from '../../core/arweave.service';
import { AuthService } from '../../auth/auth.service';
import { arwikiVersion } from '../../core/arwiki';
import { UtilsService } from '../../core/utils.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dialog-transfer-tokens',
  templateUrl: './dialog-transfer-tokens.component.html',
  styleUrls: ['./dialog-transfer-tokens.component.scss']
})
export class DialogTransferTokensComponent implements OnInit, OnDestroy {
	frmTransfer: UntypedFormGroup = new UntypedFormGroup({
		recipient: new UntypedFormControl('', [Validators.required]),
		amount: new UntypedFormControl('0', [Validators.required, Validators.min(1)])
	});
	loadingSendTokens: boolean = false;
	transferTX: string = '';
  transferSubscription: Subscription = Subscription.EMPTY;

  constructor(
  	@Inject(MAT_DIALOG_DATA) public data: any,
  	private _arweave: ArweaveService,
  	private _arwikiTokenContract: ArwikiTokenContract,
  	private _auth: AuthService,
  	private _utils: UtilsService,
    public _dialogRef: MatDialogRef<DialogTransferTokensComponent>
  ) { }

  ngOnInit(): void {
  }
  ngOnDestroy() {
    if (this.transferSubscription) {
      this.transferSubscription.unsubscribe();
    }
  }

  public get amount() {
  	return this.frmTransfer.get('amount');
  }

  public get recipient() {
  	return this.frmTransfer.get('recipient');
  }

  onSubmit() {
  	const recipient = this.recipient!.value;
  	const amount = +this.amount!.value;
  	this.transferTokens(recipient, amount);
  }

  transferTokens(recipient: string, amount: number) {
  	this.loadingSendTokens = true;
  	this.transferSubscription = this._arwikiTokenContract.transferTokens(
			recipient,
			this._auth.getPrivateKey(),
			amount,
			arwikiVersion[0]
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
      },
      error: (error) => {
        console.error('transferTokens', error);
        this._utils.message(`Error sending tokens.`, 'error');
        this._dialogRef.close();
      }
    });
  	
  }
}
