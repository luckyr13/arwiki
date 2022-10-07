import { Component, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';
import { Subscription, from } from 'rxjs';
import { ArweaveService } from '../../core/arweave.service';
import { AuthService } from '../../auth/auth.service';
import { arwikiVersion } from '../../core/arwiki';

@Component({
  templateUrl: './add-admin.component.html',
  styleUrls: ['./add-admin.component.scss']
})
export class AddAdminComponent implements OnInit, OnDestroy {
	createAdminFrm: UntypedFormGroup = new UntypedFormGroup({
		newAdminAddress: new UntypedFormControl('')
	});
  formLoading = false;
  saveAdminSubscription: Subscription = Subscription.EMPTY;
  newadminTX: any;

  constructor(
    private _snackBar: MatSnackBar,
    private _arwikiTokenContract: ArwikiTokenContract,
    private _auth: AuthService,
    private _arweave: ArweaveService
  ) { }

  get newAdminAddress() {
  	return this.createAdminFrm.get('newAdminAddress')!;
  }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    if (this.saveAdminSubscription) {
      this.saveAdminSubscription.unsubscribe();
    }
  }
  
  createNewAdmin() {
  	const address: string = this.newAdminAddress.value;
    // Disable form 
    this.formLoading = true;
    this.newAdminAddress.disable();
    
    this.saveAdminSubscription = from(this._arwikiTokenContract.registerAdmin(
      address,
      this._auth.getPrivateKey(),
      arwikiVersion[0]
    )).subscribe({
      next: (res) => {
        this.newadminTX = res;
        this.message('New admin proposal created!', 'success');
            
        // Enable form 
        this.formLoading = false;
        this.newAdminAddress.enable();
        this.newAdminAddress.setValue('');
      },
      error: (error) => {
        this.message(error, 'error');

        // Enable form 
        this.formLoading = false;
        this.newAdminAddress.enable();
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
