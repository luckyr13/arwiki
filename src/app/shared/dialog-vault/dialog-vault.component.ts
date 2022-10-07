import { Component, OnInit, Inject, ViewChild, AfterViewInit, OnDestroy  } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Validators } from '@angular/forms';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';
import { ArweaveService } from '../../core/arweave.service';
import { AuthService } from '../../auth/auth.service';
import { arwikiVersion } from '../../core/arwiki';
import { MatSnackBar } from '@angular/material/snack-bar';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dialog-vault',
  templateUrl: './dialog-vault.component.html',
  styleUrls: ['./dialog-vault.component.scss']
})
export class DialogVaultComponent implements OnInit, AfterViewInit, OnDestroy  {
  frmTransfer: UntypedFormGroup = new UntypedFormGroup({
		lockLength: new UntypedFormControl(
      this.data.lockMinLength, [Validators.required]
    ),
		amount: new UntypedFormControl(
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
  lockVaultSubscription: Subscription = Subscription.EMPTY;
  unlockVaultSubscription: Subscription = Subscription.EMPTY;

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource<any>(this.data.vault);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy() {
    if (this.lockVaultSubscription) {
      this.lockVaultSubscription.unsubscribe();
    }
    if (this.unlockVaultSubscription) {
      this.unlockVaultSubscription.unsubscribe();
    }
    
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


  onSubmit() {
  	const lockLength = +this.lockLength!.value;
  	const amount = +this.amount!.value;
  	this.lockTokensInVault(lockLength, amount);
  }


  async lockTokensInVault(
    lockLength: number, amount: number
  ) {
    this.loadingSendTokens = true;
    this.lockVaultSubscription = this._arwikiTokenContract.lockTokensInVault(
        lockLength,
        amount,
        this._auth.getPrivateKey(),
        arwikiVersion[0]
      ).subscribe({
        next: (res) => {
          this.transferTX = `${res}`;
        }, 
        error: (error) => {
          this.errorMsg = `${error}`;
          this.message(`${error}`);
        }
      })
    
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

  unlockVault() {
    this.loadingUnlockVault = true;
    this.unlockVaultSubscription = this._arwikiTokenContract
      .unlockVault(
        this._auth.getPrivateKey(),
        arwikiVersion[0]
      ).subscribe({
        next: (res) => {
          this.unlockVaultTX = `${res}`;
        },
        error: (error) => {
          this.errorMsg = `${error}`;
          this.message(`${error}`, 'error');
        }
      });
  }

}
