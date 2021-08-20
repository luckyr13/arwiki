import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';
import { FormControl, FormGroup } from '@angular/forms';
import { Validators } from '@angular/forms';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token';
import { ArweaveService } from '../../core/arweave.service';
import { AuthService } from '../../auth/auth.service';
import { arwikiVersion } from '../../core/arwiki';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-dialog-transfer-tokens',
  templateUrl: './dialog-transfer-tokens.component.html',
  styleUrls: ['./dialog-transfer-tokens.component.scss']
})
export class DialogTransferTokensComponent implements OnInit {
	frmTransfer: FormGroup = new FormGroup({
		recipient: new FormControl('', [Validators.required]),
		amount: new FormControl('0', [Validators.required, Validators.min(1)])
	});
	loadingSendTokens: boolean = false;
	transferTX: string = '';

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

  public get amount() {
  	return this.frmTransfer.get('amount');
  }

  public get recipient() {
  	return this.frmTransfer.get('recipient');
  }


  async onSubmit() {
  	const recipient = this.recipient!.value;
  	const amount = +this.amount!.value;
  	await this.transferTokens(recipient, amount);
  }

  async transferTokens(recipient: string, amount: number) {
  	this.loadingSendTokens = true;
  	try {
  		this.transferTX = await this._arwikiTokenContract.transferTokens(
  			recipient,
  			this._auth.getPrivateKey(),
  			amount,
  			arwikiVersion[0]
  		);
  	} catch (err) {
  		this.message(err, 'error');
  		this._dialogRef.close();
  	}
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
