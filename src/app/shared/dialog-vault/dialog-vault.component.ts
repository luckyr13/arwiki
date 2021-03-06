import { Component, OnInit, Inject, ViewChild, AfterViewInit  } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';
import { FormControl, FormGroup } from '@angular/forms';
import { Validators } from '@angular/forms';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token';
import { ArweaveService } from '../../core/arweave.service';
import { AuthService } from '../../auth/auth.service';
import { arwikiVersion } from '../../core/arwiki';
import { MatSnackBar } from '@angular/material/snack-bar';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';

@Component({
  selector: 'app-dialog-vault',
  templateUrl: './dialog-vault.component.html',
  styleUrls: ['./dialog-vault.component.scss']
})
export class DialogVaultComponent implements OnInit, AfterViewInit  {
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
  columnsToDisplay = ['balance', 'lockedLength', 'page', 'status'];
  dataSource!: MatTableDataSource<any>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  loadingUnlockVault: boolean = false;
  unlockVaultTX: string = '';

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource<any>(this.data.vault);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  constructor(
  	@Inject(MAT_DIALOG_DATA) public data: any,
  	private _arweave: ArweaveService,
  	private _arwikiTokenContract: ArwikiTokenContract,
  	private _auth: AuthService,
  	private _snackBar: MatSnackBar,
    public _dialogRef: MatDialogRef<DialogVaultComponent>
  ) { }


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

  async unlockVault() {
    this.loadingUnlockVault = true;
    this.unlockVaultTX = '';
    try {
      this.unlockVaultTX = await this._arwikiTokenContract
        .unlockVault(
          this._auth.getPrivateKey(),
          arwikiVersion[0]
        );
    } catch (err) {
      this.errorMsg = err;
      this.message(err, 'error');
    }
  }

}
