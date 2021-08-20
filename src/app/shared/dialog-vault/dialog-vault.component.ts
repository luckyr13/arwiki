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
  selector: 'app-dialog-vault',
  templateUrl: './dialog-vault.component.html',
  styleUrls: ['./dialog-vault.component.scss']
})
export class DialogVaultComponent implements OnInit {
  frmTransfer: FormGroup = new FormGroup({
		lockLength: new FormControl(
      this.data.lockMinLength, [Validators.required]
    ),
		amount: new FormControl(
      '0', [Validators.required, Validators.min(1)]
    )
	});
	loadingSendTokens: boolean = false;
	transferTX: string = '';
  errorMsg: string = '';

  constructor(
  	@Inject(MAT_DIALOG_DATA) public data: any,
  	private _arweave: ArweaveService,
  	private _arwikiTokenContract: ArwikiTokenContract,
  	private _auth: AuthService,
  	private _snackBar: MatSnackBar,
    public _dialogRef: MatDialogRef<DialogVaultComponent>
  ) { }

  ngOnInit(): void {
  }

  public get amount() {
  	return this.frmTransfer.get('amount');
  }

  public get lockLength() {
  	return this.frmTransfer.get('lockLength');
  }


  async onSubmit() {
  	const lockLength = +this.lockLength!.value;
  	const amount = +this.amount!.value;
  	await this.lockTokensInVault(lockLength, amount);
  }


  async lockTokensInVault(
    lockLength: number, amount: number
  ) {
    this.loadingSendTokens = true;
    this.transferTX = '';
    try {
      this.transferTX = await this._arwikiTokenContract
        .lockTokensInVault(
          lockLength,
          amount,
          this._auth.getPrivateKey(),
          arwikiVersion[0]
        )
    } catch (err) {
      this.errorMsg = err;
      this.message(err, 'error');
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

  formatBlocks(len: number): string {
    return this._arweave.formatBlocks(len);
  }

}
