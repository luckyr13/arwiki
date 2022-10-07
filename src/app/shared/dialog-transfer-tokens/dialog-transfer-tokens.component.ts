import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Validators } from '@angular/forms';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';
import { ArweaveService } from '../../core/arweave.service';
import { AuthService } from '../../auth/auth.service';
import { arwikiVersion } from '../../core/arwiki';
import { MatSnackBar } from '@angular/material/snack-bar';
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
  	private _snackBar: MatSnackBar,
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
        this.transferTX = `${res}`
      },
      error: (error) => {
        this.message(`${error}`, 'error');
        this._dialogRef.close();
      }
    });
  	
  }

	/*
  *  Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
  }
}
