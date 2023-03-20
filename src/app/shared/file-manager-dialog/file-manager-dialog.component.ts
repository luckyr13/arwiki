import { Component, OnInit, Inject, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { TransactionMetadata } from '../../core/interfaces/transaction-metadata';
import { Subscription } from 'rxjs';
import { FileExplorerService } from '../../core/file-explorer.service';
import { ArweaveService } from '../../core/arweave.service';
import { UtilsService } from '../../core/utils.service';

@Component({
  selector: 'app-file-manager-dialog',
  templateUrl: './file-manager-dialog.component.html',
  styleUrls: ['./file-manager-dialog.component.scss']
})
export class FileManagerDialogComponent implements OnInit, OnDestroy {
  files: TransactionMetadata[] = [];
  private _loadingFilesSubscription = Subscription.EMPTY;
  private _nextResultsSubscription = Subscription.EMPTY;
  loadingFiles = false;
  loadingMore = false;
  moreResultsAvailable = true;
  @ViewChild('moreResultsCard', { read: ElementRef }) moreResultsCard!: ElementRef;

  constructor(
    private _dialogRef: MatDialogRef<FileManagerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      type: 'text'|'image'|'audio'|'video'|'',
      address: string,
    },
    private _utils: UtilsService,
    private _fileExplorer: FileExplorerService,
    private _arweave: ArweaveService) { }


  ngOnInit(): void {
    const supportedTypes: Record<string, any> =  {
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
    const types = supportedTypes[this.data.type];
    this.loadingFiles = true;
    const limit = 20;
    this._loadingFilesSubscription = this._fileExplorer.getUserFiles(types, this.data.address, limit).subscribe({
      next: (files) => {
        if (!files || !files.length) {
          this.moreResultsAvailable = false;
        }
        this.files = files;
        this.loadingFiles = false;
      },
      error: (error) => {
        this._utils.message(error, 'error');
        this.loadingFiles = false;
      }
    })
  }

  close(res: { id: string, type: 'text'|'image'|'audio'|'video'|''}|null|undefined = null) {
    this._dialogRef.close(res);
  }

  moreResults() {
    this.loadingMore = true;
    this._nextResultsSubscription = this._fileExplorer.next().subscribe({
      next: (results) => {
        if (!results || !results.length) {
          this.moreResultsAvailable = false;
        }
        this.files.push(...results);
        this.loadingMore = false;
      },
      error: (error) => {
        this.loadingMore = false;
        this._utils.message(error, 'error');
      }
    })
  }

  ngOnDestroy() {
    this._loadingFilesSubscription.unsubscribe();
    this._nextResultsSubscription.unsubscribe();
  }


  hasOwnProperty(obj: any, key: string) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  ellipsis(s: string) {
    return this._utils.ellipsis(s);
  }

  getFileUrl(tx: string) {
    return `${this._arweave.baseURL}${tx}`;
  }

  dateFormat(date: string|number|undefined) {
    const d = date ? date : '';
    return this._dateFormat(d);
  }

  private _dateFormat(d: number|string){
    if (!d) {
      return '';
    }
    const prev = new Date(+d * 1000);
    const current = new Date();
    const millisecondsEllapsed = current.getTime() - prev.getTime(); 
    const seconds = Math.floor(millisecondsEllapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    if (days) {
      const month = months[prev.getMonth()];
      const date = prev.getDate();
      const year = prev.getFullYear();
      const currentYear = current.getFullYear();
      if (currentYear === year) {
        return `${month} ${date}`;
      }
      return `${month} ${date}, ${year}`;
    } else if (hours) {
      return `${hours}h`;
    } else if (minutes) {
      return `${minutes}m`;
    } else if (seconds) {
      return `${seconds}s`;
    }


    return ``;
  }
}
