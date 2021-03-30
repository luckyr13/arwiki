import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ArweaveService } from '../../auth/arweave.service';
import { Observable, Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../auth/auth.service';
declare const window: any;

@Component({
  selector: 'app-modal-file-manager',
  templateUrl: './modal-file-manager.component.html',
  styleUrls: ['./modal-file-manager.component.scss']
})
export class ModalFileManagerComponent implements OnInit, OnDestroy {
  tabLoadTimes: Date|null = null;
  uploadFile$: Subscription = Subscription.EMPTY;
  transactionUpload: any = null;
  transactionUploadUrl: string = '';
  fileUrl: string = '';
  transactionId: string = '';
  loading: boolean = false;

  constructor(
  		private _selfDialog: MatDialogRef<ModalFileManagerComponent>,
      private _arweave: ArweaveService,
      private _snackBar: MatSnackBar,
      private _auth: AuthService
  	) { }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    if (this.uploadFile$) {
      this.uploadFile$.unsubscribe();
    }
  }

  getTimeLoaded() {
    if (!this.tabLoadTimes) {
      this.tabLoadTimes = new Date();
    }

    return this.tabLoadTimes;
  }

  close() {
  	this._selfDialog.close();
  }

  uploadFile(inputEvent: any) {
    const file = inputEvent.target.files.length ? 
          inputEvent.target.files[0] : null;
    this.loading = true;
   
    this.uploadFile$ = this._arweave.fileToArrayBuffer(file)
      .subscribe({
        next: async (data) => {
          this.transactionUpload = await this._arweave.uploadFileToArweave(
            data, file.type, this._auth.getPrivateKey()
           );

          this.transactionId = this.transactionUpload.id;

          if (this.transactionId) {
            
            window.setTimeout(() => {
              this.message('Transaction succesful!', 'success');

              this.transactionUploadUrl = `https://viewblock.io/arweave/tx/${this.transactionId}`;
              this.fileUrl= `https://arweave.net/${this.transactionId}`;
              this._selfDialog.close(this.fileUrl);
              this.loading = false;
            }, 5000);


          } else {
            this.message('Error uploading file!', 'error');
            this.loading = false;
          }

          

        },
        error: (error) => {
          this.message(error, 'error');
          this.loading = false;
        }
      });
  }

  /*
  *  Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 8000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
  }

}
