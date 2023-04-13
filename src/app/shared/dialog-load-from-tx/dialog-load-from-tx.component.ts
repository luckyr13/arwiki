import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { ArweaveService, arweaveAddressLength } from '../../core/arweave.service';
import { ArdbWrapper } from '../../core/ardb-wrapper';
import { UtilsService } from '../../core/utils.service';
import { Subscription, switchMap, of } from 'rxjs';
import { TransactionMetadata } from '../../core/interfaces/transaction-metadata';

@Component({
  selector: 'app-dialog-load-from-tx',
  templateUrl: './dialog-load-from-tx.component.html',
  styleUrls: ['./dialog-load-from-tx.component.scss']
})
export class DialogLoadFromTxComponent implements OnInit, OnDestroy {
  searchForm: UntypedFormGroup = new UntypedFormGroup({
    'query': new UntypedFormControl(
      '',
      [
        Validators.required,
        Validators.minLength(arweaveAddressLength),
        Validators.maxLength(arweaveAddressLength)
      ]
    )
  });
  resultsSubscription = Subscription.EMPTY;
  appName: string = '';
  application: string = '';
  storyType: string = '';
  storyContentType: string = '';
  isValidSubstory = false;
  loading = false;
  error = '';
  txId = '';
  finalType: string = '';
  txtContent = '';
  owner: string = '';
  supportedFiles: Record<string, string[]> = {
    'image': [
      'image/gif', 'image/png',
      'image/jpeg', 'image/bmp',
      'image/webp'
    ],
    'audio': [
      'audio/midi', 'audio/mpeg',
      'audio/webm', 'audio/ogg',
      'audio/wav'
    ],
    'video': [
      'video/webm', 'video/ogg', 'video/mp4'
    ],
    'text': [
      'text/plain'
    ],
  };
  ardb!: ArdbWrapper;

  get query() {
    return this.searchForm.get('query')!;
  }

  constructor(
    private _dialogRef: MatDialogRef<DialogLoadFromTxComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      type: string,
    },
    private _arweave: ArweaveService,
    private _utils: UtilsService) { }


  ngOnInit(): void {
    this.ardb = new ArdbWrapper(this._arweave.arweave);
  }

  close(res: { tx: string, type: string, content: string }|undefined = undefined) {
    this._dialogRef.close(res);
  }


  ngOnDestroy() {
    this.resultsSubscription.unsubscribe();
  }


  hasOwnProperty(obj: any, key: string) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }


  onSubmitSearch() {
    //const query = encodeURI(this.query!.value);
    const query = this.query!.value ? `${this.query!.value}`.trim() : '';
    this.loading = true;
    this.appName = '';
    this.application = '';
    this.storyContentType = '';
    this.storyType = '';
    this.isValidSubstory = false;
    this.error = '';
    this.txId = '';
    this.finalType = '';
    this.txtContent = '';
    this.owner = '';
    this.resultsSubscription = this.ardb.searchOneTransactionById(
      query
    ).pipe(
      switchMap((tx) => {
        if (!tx) {
          throw new Error('Tx not found!');
        }
        const txMetadata: TransactionMetadata = {
          id: tx.id,
          owner: tx.owner.address,
          blockId: tx.block && tx.block.id ? tx.block.id : '',
          blockHeight: tx.block && tx.block.height ? tx.block.height : 0,
          dataSize: tx.data ? tx.data.size : undefined,
          dataType: tx.data ? tx.data.type : undefined,
          blockTimestamp: tx.block && tx.block.timestamp ? tx.block.timestamp : undefined,
          tags: tx.tags
        };

        this.extractTagsFromPost(txMetadata);
        this.txId = txMetadata.id;
        this.owner = txMetadata.owner;
        if (this.finalType === 'text') {
          return this._arweave.getDataAsString(txMetadata.id);
        }
        return of('');
      })
    ).subscribe({
      next: (data) => {
        this.txtContent = `${data}`;
        this.loading = false;
      },
      error: (error) => {
        this.error = error;
        this._utils.message(error, 'error');
        this.loading = false;
      }
    })
  }

  validateContentType(contentType: string, desiredType: 'image'|'audio'|'video'|'text') {
    return (
      Object.prototype.hasOwnProperty.call(this.supportedFiles, desiredType) ?
      this.supportedFiles[desiredType].indexOf(contentType) >= 0 :
      false
    );
  }

  extractTagsFromPost(post: TransactionMetadata) {
    const tags = post.tags!;
    for (const t of tags) {
      // Get metadata
      if (t.name === 'App-Name') {
        this.appName = t.value;
      } else if (t.name === 'Application') {
        this.application = t.value;        
      } else if (t.name === 'Type') {
        this.storyType = t.value;        
      } else if (t.name === 'Content-Type') {
        this.storyContentType = t.value;
        this.isValidSubstory = false;

        // Validate content type
        if (this.validateContentType(this.storyContentType, 'text') &&
            this.data.type === 'text') {
          this.finalType = 'text';
          this.isValidSubstory = true;
        } else if (this.validateContentType(this.storyContentType, 'image') &&
            this.data.type === 'image') {
          this.finalType = 'image';
          this.isValidSubstory = true;
        } else if (this.validateContentType(this.storyContentType, 'video') &&
            this.data.type === 'video') {
          this.finalType = 'video';
          this.isValidSubstory = true;
        }  else if (this.validateContentType(this.storyContentType, 'audio') &&
            this.data.type === 'audio') {
          this.finalType = 'audio';
          this.isValidSubstory = true;
        } else {
          throw new Error('Invalid content type!');
        }

      }
    }
  }

  insertSubstory(txId: string) {
    this.close({tx: txId, type: this.finalType, content: this.txtContent });
  }

  getFileUrl(tx: string) {
    return `${this._arweave.baseURL}${tx}`;
  }
}
