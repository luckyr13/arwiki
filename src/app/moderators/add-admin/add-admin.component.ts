import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ArwikiSettingsContract } from '../../arwiki-contracts/arwiki-settings';
import { Subscription } from 'rxjs';
import { ArweaveService } from '../../core/arweave.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  templateUrl: './add-admin.component.html',
  styleUrls: ['./add-admin.component.scss']
})
export class AddAdminComponent implements OnInit, OnDestroy {
	createAdminFrm: FormGroup = new FormGroup({
		newAdminAddress: new FormControl('')
	});
  formLoading = false;
  saveAdminSubscription: Subscription = Subscription.EMPTY;
  newadminTX: any;

  constructor(
    private _snackBar: MatSnackBar,
    private _settingsContract: ArwikiSettingsContract,
    private _auth: AuthService,
    private _arweave: ArweaveService
  ) { }

  get newAdminAddress() {
  	return this.createAdminFrm.get('newAdminAddress');
  }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    if (this.saveAdminSubscription) {
      this.saveAdminSubscription.unsubscribe();
    }
  }
  
  createNewAdmin() {
  	const address: string = this.newAdminAddress!.value;
    // Disable form 
    this.formLoading = true;
    this.newAdminAddress!.disable();

    this.saveAdminSubscription = this._settingsContract.registerAdmin(
      this._auth.getPrivateKey(),
      address
    ).subscribe({
      next: (res) => {
        this.newadminTX = res;
        this.message('New admin created!', 'success');
            
        // Enable form 
        this.formLoading = false;
        this.newAdminAddress!.enable();
      },
      error: (error) => {
        this.message(error, 'error');

        // Enable form 
        this.formLoading = false;
        this.newAdminAddress!.enable();
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
