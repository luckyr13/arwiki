import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ArweaveService } from '../../core/arweave.service';
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
  loadMyArFilesSubscription: Subscription = Subscription.EMPTY;
  transactionUpload: any = null;
  transactionUploadUrl: string = '';
  fileUrl: string = '';
  transactionId: string = '';
  loading: boolean = false;
  files: any[] = [];
  loadingMyArFiles: boolean = false;
  baseImgUrl: string = this._arweave.baseURL;

  constructor(
      private _selfDialog: MatDialogRef<ModalFileManagerComponent>,
      private _arweave: ArweaveService,
      private _snackBar: MatSnackBar,
      private _auth: AuthService
    ) { }

  async ngOnInit() {
    await this.getMyFilesFromArweave();
  }

  ngOnDestroy() {
    if (this.uploadFile$) {
      this.uploadFile$.unsubscribe();
    }
    if (this.loadMyArFilesSubscription) {
      this.loadMyArFilesSubscription.unsubscribe();
    }
  }

  getTimeLoaded() {
    if (!this.tabLoadTimes) {
      this.tabLoadTimes = new Date();
    }

    return this.tabLoadTimes;
  }

  async getMyFilesFromArweave() {
    const networkInfo = await this._arweave.arweave.network.getInfo();
    const height = networkInfo.height;
    this.loadingMyArFiles = true;

    this.loadMyArFilesSubscription = this._arweave.getMyArFiles(
      this._auth.getMainAddressSnapshot(),
      height
    ).subscribe({
      next: (res) => {
        if (res && res.txs && res.txs.edges) {
          this.files = res.txs.edges;
        }
        this.loadingMyArFiles = false;

      },
      error: (error) => {
        this.message(error, 'error');
        this.loadingMyArFiles = false;
      }
    });
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
          const method = this._auth.loginMethod;
          const tags: {name: string, value: string}[] = [];
          const disableDispatch = true;
          this.transactionUpload = await this._arweave.uploadFileToArweave(
            data, file.type, this._auth.getPrivateKey(), tags, method, disableDispatch
           );

          this.transactionId = this.transactionUpload.id;

          if (this.transactionId) {
            
            window.setTimeout(() => {
              this.message('Transaction succesful!', 'success');

              this.transactionUploadUrl = `https://viewblock.io/arweave/tx/${this.transactionId}`;
              this.fileUrl= `${this.baseImgUrl + this.transactionId}`;
              this._selfDialog.close(this.transactionId);
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
